import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  corporateBookings,
  bookings,
  classes,
  companies,
  companyMembers,
  checkins,
  users,
} from "@/db/schema";
import {
  hoursUntil,
  isCancellationRefundable,
  deductCorporateCredits,
  refundCorporateCredits,
} from "./credit.service";
import { promoteNextCorporateInWaitlist } from "./waitlist.service";

export async function getCompanyForMember(
  db: typeof import("@/db").db,
  userId: number,
) {
  return db
    .select()
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(
      and(
        eq(companyMembers.userId, userId),
        eq(companies.active, true),
      ),
    )
    .get();
}

export async function getCorporateBookings(
  db: typeof import("@/db").db,
  userId: number,
  includePast: boolean,
) {
  const rows = await db
    .select({
      id: corporateBookings.id,
      status: corporateBookings.status,
      creditsUsed: corporateBookings.creditsUsed,
      bookedAt: corporateBookings.bookedAt,
      classId: classes.id,
      className: classes.name,
      room: classes.room,
      startsAt: classes.startsAt,
      durationMin: classes.durationMin,
      cancelled: classes.cancelled,
      companyName: companies.name,
    })
    .from(corporateBookings)
    .innerJoin(classes, eq(corporateBookings.classId, classes.id))
    .innerJoin(companies, eq(corporateBookings.companyId, companies.id))
    .where(eq(corporateBookings.userId, userId))
    .orderBy(asc(classes.startsAt));

  const now = new Date();
  return rows.filter((r) =>
    includePast ? true : new Date(r.startsAt) >= now,
  );
}

export async function createCorporateBooking(
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
    .from(corporateBookings)
    .where(
      and(
        eq(corporateBookings.classId, cls.id),
        eq(corporateBookings.userId, userId),
        inArray(corporateBookings.status, ["booked", "waitlisted"]),
      ),
    )
    .get();

  if (existing) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "You are already on the list for this class.",
    });
  }

  const companyRow = await getCompanyForMember(db, userId);
  if (!companyRow) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not linked to an active company.",
    });
  }

  const company = companyRow.companies;
  if (company.creditPoolBalance < cls.creditCost) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your company does not have enough credits.",
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
      and(
        eq(corporateBookings.classId, cls.id),
        eq(corporateBookings.status, "booked"),
      ),
    );

  const isFull = Number(stdCount) + Number(corpCount) >= cls.capacity;

  const created = await db
    .insert(corporateBookings)
    .values({
      classId: cls.id,
      userId: userId,
      companyId: company.id,
      status: isFull ? "waitlisted" : "booked",
      creditsUsed: isFull ? 0 : cls.creditCost,
    })
    .returning()
    .get();

  if (!isFull) {
    await deductCorporateCredits(
      db,
      company.id,
      company.creditPoolBalance,
      cls.creditCost,
    );
  }

  return created;
}

export async function cancelCorporateBooking(
  db: typeof import("@/db").db,
  userId: number,
  bookingId: number,
  isStaff: boolean,
) {
  const row = await db
    .select({ booking: corporateBookings, cls: classes })
    .from(corporateBookings)
    .innerJoin(classes, eq(corporateBookings.classId, classes.id))
    .where(eq(corporateBookings.id, bookingId))
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
    true,
  );

  await db
    .update(corporateBookings)
    .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
    .where(eq(corporateBookings.id, row.booking.id));

  if (refundable) {
    await refundCorporateCredits(db, row.booking.companyId, row.booking.creditsUsed);
  }

  // Freeing a confirmed spot promotes the member who has waited longest.
  if (row.booking.status === "booked") {
    await promoteNextCorporateInWaitlist(db, row.cls.id, row.cls.creditCost);
  }

  return { ok: true, refunded: refundable };
}

export async function checkInCorporateMember(
  db: typeof import("@/db").db,
  bookingId: number,
) {
  const booking = await db
    .select()
    .from(corporateBookings)
    .where(eq(corporateBookings.id, bookingId))
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
    .update(corporateBookings)
    .set({ status: "attended" })
    .where(eq(corporateBookings.id, booking.id));

  await db.insert(checkins).values({
    userId: booking.userId,
    bookingId: null,
  });

  return { ok: true };
}

export async function getCorporateClassRoster(db: typeof import("@/db").db, classId: number) {
  return db
    .select({
      bookingId: corporateBookings.id,
      status: corporateBookings.status,
      memberId: users.id,
      memberName: users.name,
      memberEmail: users.email,
      bookedAt: corporateBookings.bookedAt,
      companyName: companies.name,
    })
    .from(corporateBookings)
    .innerJoin(users, eq(corporateBookings.userId, users.id))
    .innerJoin(companies, eq(corporateBookings.companyId, companies.id))
    .where(eq(corporateBookings.classId, classId))
    .orderBy(asc(corporateBookings.bookedAt));
}
