import { and, desc, eq, sql } from "drizzle-orm";
import { memberships, companies } from "@/db/schema";
import {
  FREE_CANCELLATION_HOURS,
  CORPORATE_FREE_CANCELLATION_HOURS,
  UNLIMITED_CREDITS,
} from "@/lib/constants";

export {
  FREE_CANCELLATION_HOURS,
  CORPORATE_FREE_CANCELLATION_HOURS,
  UNLIMITED_CREDITS,
};


export function hoursUntil(iso: string, now = new Date()): number {
  return (new Date(iso).getTime() - now.getTime()) / 36e5;
}

export function isCancellationRefundable(
  startsAt: string,
  creditsUsed: number,
  isCorporate: boolean,
): boolean {
  const limitHours = isCorporate
    ? CORPORATE_FREE_CANCELLATION_HOURS
    : FREE_CANCELLATION_HOURS;
  return hoursUntil(startsAt) >= limitHours && creditsUsed > 0;
}

export async function activeMembershipFor(
  db: typeof import("@/db").db,
  userId: number,
) {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        sql`${memberships.endDate} >= ${today}`,
      ),
    )
    .orderBy(desc(memberships.endDate))
    .get();
}

export async function deductCredits(
  db: typeof import("@/db").db,
  membershipId: number,
  creditsRemaining: number,
  cost: number,
) {
  if (creditsRemaining < UNLIMITED_CREDITS) {
    await db
      .update(memberships)
      .set({ creditsRemaining: creditsRemaining - cost })
      .where(eq(memberships.id, membershipId));
  }
}

export async function refundCredits(
  db: typeof import("@/db").db,
  membershipId: number,
  creditsToRefund: number,
) {
  const ms = await db
    .select()
    .from(memberships)
    .where(eq(memberships.id, membershipId))
    .get();

  if (ms && ms.creditsRemaining < UNLIMITED_CREDITS) {
    await db
      .update(memberships)
      .set({ creditsRemaining: ms.creditsRemaining + creditsToRefund })
      .where(eq(memberships.id, membershipId));
  }
}

export async function deductCorporateCredits(
  db: typeof import("@/db").db,
  companyId: number,
  creditsRemaining: number,
  cost: number,
) {
  await db
    .update(companies)
    .set({ creditPoolBalance: creditsRemaining - cost })
    .where(eq(companies.id, companyId));
}

export async function refundCorporateCredits(
  db: typeof import("@/db").db,
  companyId: number,
  creditsToRefund: number,
) {
  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .get();

  if (company) {
    await db
      .update(companies)
      .set({ creditPoolBalance: company.creditPoolBalance + creditsToRefund })
      .where(eq(companies.id, companyId));
  }
}
