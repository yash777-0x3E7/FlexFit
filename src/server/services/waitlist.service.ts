import { and, asc, eq, sql } from "drizzle-orm";
import {
  bookings,
  memberships,
  corporateBookings,
  companies,
  notifications,
} from "@/db/schema";
import { UNLIMITED_CREDITS } from "@/lib/constants";

export async function getWaitlistPosition(
  db: typeof import("@/db").db,
  classId: number,
  bookedAt: string,
): Promise<number> {
  const [{ stdPos }] = await db
    .select({ stdPos: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, classId),
        eq(bookings.status, "waitlisted"),
        sql`${bookings.bookedAt} < ${bookedAt}`,
      ),
    );

  const [{ corpPos }] = await db
    .select({ corpPos: sql<number>`count(*)` })
    .from(corporateBookings)
    .where(
      and(
        eq(corporateBookings.classId, classId),
        eq(corporateBookings.status, "waitlisted"),
        sql`${corporateBookings.bookedAt} < ${bookedAt}`,
      ),
    );

  return Number(stdPos) + Number(corpPos) + 1;
}

export async function promoteNextInWaitlist(
  db: typeof import("@/db").db,
  classId: number,
  creditCost: number,
): Promise<boolean> {
  const nextStd = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.classId, classId),
        eq(bookings.status, "waitlisted"),
      ),
    )
    .orderBy(asc(bookings.bookedAt))
    .get();

  const nextCorp = await db
    .select()
    .from(corporateBookings)
    .where(
      and(
        eq(corporateBookings.classId, classId),
        eq(corporateBookings.status, "waitlisted"),
      ),
    )
    .orderBy(asc(corporateBookings.bookedAt))
    .get();

  if (!nextStd && !nextCorp) {
    return false;
  }

  // Determine which user queued earlier
  let promoteStd = false;
  if (nextStd && !nextCorp) {
    promoteStd = true;
  } else if (nextStd && nextCorp) {
    promoteStd = new Date(nextStd.bookedAt) <= new Date(nextCorp.bookedAt);
  }

  if (promoteStd && nextStd) {
    await db
      .update(bookings)
      .set({ status: "booked", creditsUsed: creditCost })
      .where(eq(bookings.id, nextStd.id));

    if (nextStd.membershipId) {
      const ms = await db
        .select()
        .from(memberships)
        .where(eq(memberships.id, nextStd.membershipId))
        .get();

      if (ms && ms.creditsRemaining < UNLIMITED_CREDITS) {
        await db
          .update(memberships)
          .set({
            creditsRemaining: Math.max(0, ms.creditsRemaining - creditCost),
          })
          .where(eq(memberships.id, ms.id));
      }
    }

    await db.insert(notifications).values({
      userId: nextStd.userId,
      type: "waitlist_promotion",
      title: "You're off the waitlist!",
      message: "A spot opened up and you've been moved to a confirmed booking.",
    });
    return true;
  } else if (nextCorp) {
    await db
      .update(corporateBookings)
      .set({ status: "booked", creditsUsed: creditCost })
      .where(eq(corporateBookings.id, nextCorp.id));

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, nextCorp.companyId))
      .get();

    if (company && company.creditPoolBalance >= creditCost) {
      await db
        .update(companies)
        .set({
          creditPoolBalance: Math.max(0, company.creditPoolBalance - creditCost),
        })
        .where(eq(companies.id, company.id));
    }

    await db.insert(notifications).values({
      userId: nextCorp.userId,
      type: "waitlist_promotion",
      title: "You're off the waitlist!",
      message: "A spot opened up and you've been moved to a confirmed booking.",
    });
    return true;
  }

  return false;
}

export async function promoteNextCorporateInWaitlist(
  db: typeof import("@/db").db,
  classId: number,
  creditCost: number,
): Promise<boolean> {
  return promoteNextInWaitlist(db, classId, creditCost);
}
