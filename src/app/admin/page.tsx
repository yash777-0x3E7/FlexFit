"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatMoney } from "@/lib/format";
import { Loading } from "@/components/common/Feedback";
import { StatGrid } from "@/components/common/StatTile";
import { PageHeader } from "@/components/common/PageHeader";
import { UtilisationList, RecentPayments } from "@/components/admin/OverviewLists";

export default function AdminPage() {
  const { data: stats, isLoading, error } = trpc.admin.stats.useQuery(undefined, {
    retry: false,
  });
  const { data: utilisation } = trpc.admin.classUtilisation.useQuery({ limit: 8 });
  const { data: payments } = trpc.payments.all.useQuery({ limit: 10 });

  if (isLoading) return <Loading />;
  if (error) return <p className="muted">{error.message}</p>;

  const tiles = [
    ["Members", String(stats!.totalMembers)],
    ["Active memberships", String(stats!.activeMemberships)],
    ["Upcoming classes", String(stats!.upcomingClasses)],
    ["Revenue", formatMoney(stats!.revenueCents)],
    ["Check-ins", String(stats!.totalCheckins)],
    ["Pending payments", String(stats!.pendingPayments)],
  ].map(([label, value]) => ({ label, value }));

  return (
    <div className="space-y-8">
      <PageHeader title="Admin">
        <div className="flex gap-2">
          <Link href="/admin/companies" className="btn btn-sm">
            Corporate Memberships
          </Link>
          <Link href="/admin/reports" className="btn btn-sm">
            Reports
          </Link>
          <Link href="/admin/announcements" className="btn btn-sm">
            Send announcement
          </Link>
        </div>
      </PageHeader>

      <StatGrid items={tiles} cols="sm:grid-cols-3" />

      <UtilisationList utilisation={utilisation} />
      <RecentPayments payments={payments} />
    </div>
  );
}