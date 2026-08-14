"use client";

import { trpc } from "@/lib/trpc";
import { formatMoney } from "@/lib/format";
import { Loading } from "@/components/common/Feedback";
import { StatGrid } from "@/components/common/StatTile";
import { PageHeader } from "@/components/common/PageHeader";
import {
  RevenueByMonth,
  RevenueByMethod,
  ExpiringMembers,
} from "@/components/admin/Reports";

export default function AdminReportsPage() {
  const { data: revenueByMonth, isLoading: monthLoading } =
    trpc.admin.revenueByMonth.useQuery();
  const { data: revenueByMethod, isLoading: methodLoading } =
    trpc.admin.revenueByMethod.useQuery();
  const { data: expiringMembers, isLoading: expiringLoading } =
    trpc.admin.expiringMemberships.useQuery();
  const { data: refundData, isLoading: refundLoading } =
    trpc.admin.refundCount.useQuery();

  const isLoading = monthLoading || methodLoading || expiringLoading || refundLoading;

  if (isLoading) return <Loading label="Loading reports..." />;

  const totalRevenue = (revenueByMonth || []).reduce(
    (sum, row) => sum + row.totalCents,
    0,
  );

  const tiles = [
    { label: "Total Revenue", value: formatMoney(totalRevenue) },
    { label: "Refunds Issued", value: refundData?.count ?? 0 },
    { label: "Payment Methods", value: revenueByMethod?.length ?? 0 },
    { label: "Expiring Soon", value: expiringMembers?.length ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Payment analytics and member insights" />

      <StatGrid items={tiles} cols="sm:grid-cols-4" />

      <RevenueByMonth rows={revenueByMonth || []} />
      <RevenueByMethod rows={revenueByMethod || []} />
      <ExpiringMembers members={expiringMembers || []} />
    </div>
  );
}