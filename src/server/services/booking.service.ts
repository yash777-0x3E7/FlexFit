import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { bookings, corporateBookings, classes, memberships, checkins, users } from "@/db/schema";
import {
  activeMembershipFor,
  hoursUntil,
  isCancellationRefundable,
  deductCredits,
  refundCredits,
  UNLIMITED_CREDITS,
} from "./credit.service";
import { getWaitlistPosition, promoteNextInWaitlist } from "./waitlist.service";
import { getCompanyForMember, createCorporateBooking } from "./corporate.service";

export async function getMemberBookings(
  db: typeof import("@/db").db,
  userId: number,
  includePast: boolean,
) {
  const rows = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      creditsUsed: bookings.creditsUsed,
      bookedAt: bookings.bookedAt,
      classId: classes.id,
      className: classes.name,
      room: classes.room,
      startsAt: classes.startsAt,
      durationMin: classes.durationMin,
      cancelled: classes.cancelled,
    })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.userId, userId))
    .orderBy(asc(classes.startsAt));

  const now = new Date();
  return rows.filter((r) =>
    includePast ? true : new Date(r.startsAt) >= now,
  );
}

export async function createMemberBooking(
  db: typeof import("@/db").db,
  userId: number,
  classId: number,
) {
  const cls = await db
    .select()
    .from(classes)
    .where(eq(classes.id, classId))
    .get();

  if (!cls) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });
  }
  if (cls.cancelled) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This class has been cancelled.",
    });
  }
  if (hoursUntil(cls.startsAt) <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This class has already started.",
    });
  }

  const existing = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, cls.id),
        eq(bookings.userId, userId),
        inArray(bookings.status, ["booked", "waitlisted"]),
      ),
    )
    .get();

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "You are already on the list for this class.",
    });
  }

  const membership = await activeMembershipFor(db, userId);
  if (!membership) {
    const company = await getCompanyForMember(db, userId);
    if (company) {
      return createCorporateBooking(db, userId, classId);
    }
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "An active membership is required to book classes.",
    });
  }

  const unlimited = membership.creditsRemaining >= UNLIMITED_CREDITS;
  if (!unlimited && membership.creditsRemaining < cls.creditCost) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not enough class credits remaining.",
    });
  }

  const [{ stdCount }] = await db
    .select({ stdCount: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(eq(bookings.classId, cls.id), eq(bookings.status, "booked")),
    );

  const [{ corpCount }] = await db
    .select({ corpCount: sql<number>`count(*)` })
    .from(corporateBookings)
    .where(
      and(eq(corporateBookings.classId, cls.id), eq(corporateBookings.status, "booked")),
    );

  const isFull = Number(stdCount) + Number(corpCount) >= cls.capacity;

  const created = await db
    .insert(bookings)
    .values({
      classId: cls.id,
      userId: userId,
      membershipId: membership.id,
      status: isFull ? "waitlisted" : "booked",
      creditsUsed: isFull ? 0 : cls.creditCost,
    })
    .returning()
    .get();

  if (!isFull) {
    await deductCredits(db, membership.id, membership.creditsRemaining, cls.creditCost);
  }

  return created;
}

export async function cancelMemberBooking(
  db: typeof import("@/db").db,
  userId: number,
  bookingId: number,
  isStaff: boolean,
) {
  const row = await db
    .select({ booking: bookings, cls: classes })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.id, bookingId))
    .get();

  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  }

  const isOwner = row.booking.userId === userId;
  if (!isOwner && !isStaff) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You cannot cancel this booking.",
    });
  }

  if (row.booking.status !== "booked" && row.booking.status !== "waitlisted") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This booking is no longer active.",
    });
  }

  const refundable = isCancellationRefundable(
    row.cls.startsAt,
    row.booking.creditsUsed,
    false,
  );

  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(eq(bookings.id, row.booking.id));

  if (refundable && row.booking.membershipId) {
    await refundCredits(db, row.booking.membershipId, row.booking.creditsUsed);
  }

  // Freeing a confirmed spot promotes the member who has waited longest.
  if (row.booking.status === "booked") {
    await promoteNextInWaitlist(db, row.cls.id, row.cls.creditCost);
  }

  return { ok: true, refunded: refundable };
}

export async function checkInMember(
  db: typeof import("@/db").db,
  bookingId: number,
  source: "front_desk" | "kiosk" | "app",
) {
  const booking = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .get();

  if (!booking) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found." });
  }
  if (booking.status !== "booked") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only confirmed bookings can be checked in.",
    });
  }

  await db
    .update(bookings)
    .set({ status: "attended" })
    .where(eq(bookings.id, booking.id));

  await db.insert(checkins).values({
    userId: booking.userId,
    bookingId: booking.id,
    source: source,
  });

  return { ok: true };
}

export async function getClassRoster(db: typeof import("@/db").db, classId: number) {
  return db
    .select({
      bookingId: bookings.id,
      status: bookings.status,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      bookedAt: bookings.bookedAt,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(eq(bookings.classId, classId))
    .orderBy(asc(bookings.bookedAt));
}

export async function getUpcomingForMember(
  db: typeof import("@/db").db,
  userId: number,
  hoursAhead: number,
) {
  const now = new Date().toISOString();
  const futureTime = new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString();

  return db
    .select({
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      classId: classes.id,
      className: classes.name,
      room: classes.room,
      startsAt: classes.startsAt,
      durationMin: classes.durationMin,
      capacity: classes.capacity,
      trainerId: classes.trainerId,
      trainerName: users.name,
    })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .leftJoin(users, eq(classes.trainerId, users.id))
    .where(
      and(
        eq(bookings.userId, userId),
        eq(bookings.status, "booked"),
        sql`${classes.startsAt} >= ${now}`,
        sql`${classes.startsAt} <= ${futureTime}`,
        eq(classes.cancelled, false),
      ),
    )
    .orderBy(classes.startsAt);
}

export async function getCheckinCount(db: typeof import("@/db").db, classId: number) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(checkins)
    .innerJoin(bookings, eq(checkins.bookingId, bookings.id))
    .where(eq(bookings.classId, classId));

  return { count: Number(result?.count ?? 0) };
}

export async function getWaitlistedBookingsWithPosition(
  db: typeof import("@/db").db,
  userId: number,
) {
  const waitlistedBookings = await db
    .select({
      bookingId: bookings.id,
      classId: classes.id,
      className: classes.name,
      room: classes.room,
      startsAt: classes.startsAt,
      durationMin: classes.durationMin,
      capacity: classes.capacity,
      bookedAt: bookings.bookedAt,
    })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(
      and(
        eq(bookings.userId, userId),
        eq(bookings.status, "waitlisted"),
      ),
    )
    .orderBy(asc(classes.startsAt));

  const result = await Promise.all(
    waitlistedBookings.map(async (wb) => {
      const position = await getWaitlistPosition(db, wb.classId, wb.bookedAt);
      return {
        ...wb,
        position,
      };
    }),
  );

  return result;
}
