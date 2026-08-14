import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  bookings,
  classes,
  memberships,
  reschedules,
  corporateBookings,
} from "@/db/schema";
import { hoursUntil } from "./credit.service";
import { promoteNextInWaitlist } from "./waitlist.service";
import { FREE_RESCHEDULE_HOURS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Shared validation helpers
// ---------------------------------------------------------------------------

export type RescheduleValidationResult =
  | { valid: true; targetIsFull: boolean }
  | { valid: false; reason: string };

/**
 * Validates that a reschedule from `fromBookingId` to `toClassId` is allowed
 * for the given `userId`. Returns a structured result rather than throwing so
 * it can be used by both the `validateReschedule` query and the `reschedule`
 * mutation without duplicating logic.
 */
export async function validateReschedule(
  db: typeof import("@/db").db,
  userId: number,
  fromBookingId: number,
  toClassId: number,
): Promise<RescheduleValidationResult> {
  // 1. Load original booking + class
  const originalRow = await db
    .select({ booking: bookings, cls: classes })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.id, fromBookingId))
    .get();

  if (!originalRow) {
    return { valid: false, reason: "Booking not found." };
  }

  const { booking: originalBooking, cls: originalClass } = originalRow;

  // 2. Ownership check
  if (originalBooking.userId !== userId) {
    return { valid: false, reason: "You cannot reschedule this booking." };
  }

  // 3. Booking must be active
  if (originalBooking.status !== "booked" && originalBooking.status !== "waitlisted") {
    return { valid: false, reason: "This booking is no longer active." };
  }

  // 4. Must be within the free reschedule window
  if (hoursUntil(originalClass.startsAt) < FREE_RESCHEDULE_HOURS) {
    return {
      valid: false,
      reason: `You can only reschedule up to ${FREE_RESCHEDULE_HOURS} hours before the class starts.`,
    };
  }

  // 5. Target class must exist
  const targetClass = await db
    .select()
    .from(classes)
    .where(eq(classes.id, toClassId))
    .get();

  if (!targetClass) {
    return { valid: false, reason: "Target class not found." };
  }

  // 6. Same class name (same type of class)
  if (targetClass.name !== originalClass.name) {
    return { valid: false, reason: "You can only reschedule to a class with the same name." };
  }

  // 7. Not the same class instance
  if (targetClass.id === originalClass.id) {
    return { valid: false, reason: "You are already booked for this class." };
  }

  // 8. Target class has not yet started
  if (hoursUntil(targetClass.startsAt) <= 0) {
    return { valid: false, reason: "This class has already started." };
  }

  // 9. Target class must not be cancelled
  if (targetClass.cancelled) {
    return { valid: false, reason: "This class has been cancelled." };
  }

  // 10. No duplicate active booking for the target class
  const existingBooking = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, targetClass.id),
        eq(bookings.userId, userId),
        sql`${bookings.status} in ('booked', 'waitlisted')`,
      ),
    )
    .get();

  if (existingBooking) {
    return { valid: false, reason: "You already have an active booking for this class." };
  }

  // 11. Determine capacity (combined standard + corporate, matching book())
  const [{ stdCount }] = await db
    .select({ stdCount: sql<number>`count(*)` })
    .from(bookings)
    .where(and(eq(bookings.classId, targetClass.id), eq(bookings.status, "booked")));

  const [{ corpCount }] = await db
    .select({ corpCount: sql<number>`count(*)` })
    .from(corporateBookings)
    .where(
      and(
        eq(corporateBookings.classId, targetClass.id),
        eq(corporateBookings.status, "booked"),
      ),
    );

  const targetIsFull = Number(stdCount) + Number(corpCount) >= targetClass.capacity;

  return { valid: true, targetIsFull };
}

// ---------------------------------------------------------------------------
// Reschedule mutation
// ---------------------------------------------------------------------------

export async function rescheduleBooking(
  db: typeof import("@/db").db,
  userId: number,
  fromBookingId: number,
  toClassId: number,
) {
  const result = await validateReschedule(db, userId, fromBookingId, toClassId);

  if (!result.valid) {
    throw new TRPCError({ code: "BAD_REQUEST", message: result.reason });
  }

  // Re-fetch original booking + target class now that validation passed
  const originalRow = await db
    .select({ booking: bookings, cls: classes })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.id, fromBookingId))
    .get();

  // This cannot be null after passing validation, but we guard for type-safety
  if (!originalRow) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  }

  const { booking: originalBooking, cls: originalClass } = originalRow;

  const targetClass = await db
    .select()
    .from(classes)
    .where(eq(classes.id, toClassId))
    .get();

  if (!targetClass) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Target class not found." });
  }

  // Create the new booking (credits carry over — no extra charge for same-class reschedule)
  const newBooking = await db
    .insert(bookings)
    .values({
      classId: targetClass.id,
      userId,
      membershipId: originalBooking.membershipId,
      status: result.targetIsFull ? "waitlisted" : "booked",
      creditsUsed: originalBooking.creditsUsed,
    })
    .returning()
    .get();

  // Cancel the original booking
  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(eq(bookings.id, originalBooking.id));

  // If a confirmed spot was freed, promote the next waitlisted user
  if (originalBooking.status === "booked") {
    await promoteNextInWaitlist(db, originalClass.id, originalClass.creditCost);
  }

  // Record the reschedule audit trail
  await db.insert(reschedules).values({
    userId,
    fromBookingId: originalBooking.id,
    toBookingId: newBooking.id,
    fromClassId: originalClass.id,
    toClassId: targetClass.id,
  });

  return {
    ok: true,
    newBooking,
    newStatus: result.targetIsFull ? "waitlisted" : "booked",
  };
}

// ---------------------------------------------------------------------------
// History query
// ---------------------------------------------------------------------------

export async function getRescheduleHistory(
  db: typeof import("@/db").db,
  userId: number,
) {
  return db
    .select({
      id: reschedules.id,
      rescheduledAt: reschedules.rescheduledAt,
      fromClassName: classes.name,
      fromClassTime: sql<string>`(
        SELECT ${classes.startsAt} FROM ${classes}
        WHERE ${classes.id} = ${reschedules.fromClassId}
      )`,
      fromClassRoom: sql<string>`(
        SELECT ${classes.room} FROM ${classes}
        WHERE ${classes.id} = ${reschedules.fromClassId}
      )`,
      toClassName: sql<string>`(
        SELECT ${classes.name} FROM ${classes}
        WHERE ${classes.id} = ${reschedules.toClassId}
      )`,
      toClassTime: sql<string>`(
        SELECT ${classes.startsAt} FROM ${classes}
        WHERE ${classes.id} = ${reschedules.toClassId}
      )`,
      toClassRoom: sql<string>`(
        SELECT ${classes.room} FROM ${classes}
        WHERE ${classes.id} = ${reschedules.toClassId}
      )`,
    })
    .from(reschedules)
    .innerJoin(classes, eq(reschedules.fromClassId, classes.id))
    .where(eq(reschedules.userId, userId))
    .orderBy(desc(reschedules.rescheduledAt));
}
