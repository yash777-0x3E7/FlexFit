"use client";

import { formatMoney, formatDate } from "@/lib/format";

export function RevenueByMonth({
  rows,
}: {
  rows: { month: string; totalCents: number }[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Revenue by Month</h2>
      {rows.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((row) => (
            <div
              key={row.month}
              className="flex items-center justify-between p-3 text-sm"
            >
              <span className="muted">{row.month}</span>
              <span className="font-medium">{formatMoney(row.totalCents)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No revenue data available.</p>
      )}
    </section>
  );
}

export function RevenueByMethod({
  rows,
}: {
  rows: { method: string; totalCents: number; count: number }[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Revenue by Payment Method</h2>
      {rows.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((row) => (
            <div
              key={row.method}
              className="flex items-center justify-between p-3 text-sm"
            >
              <div className="flex-1">
                <div className="capitalize">{row.method}</div>
                <div className="muted text-xs">{row.count} transactions</div>
              </div>
              <span className="font-medium">{formatMoney(row.totalCents)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No payment method data available.</p>
      )}
    </section>
  );
}

export function ExpiringMembers({
  members,
}: {
  members: {
    memberId: number;
    memberName: string;
    memberEmail: string;
    planName: string;
    expiresAt: string;
  }[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Memberships Expiring in 14 Days</h2>
      {members.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {members.map((member) => (
            <div key={member.memberId} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{member.memberName}</div>
                  <div className="muted text-xs">{member.memberEmail}</div>
                </div>
                <div className="text-right">
                  <div className="muted text-xs">{member.planName}</div>
                  <div className="text-xs">{formatDate(member.expiresAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">
          No memberships expiring in the next 14 days.
        </p>
      )}
    </section>
  );
}