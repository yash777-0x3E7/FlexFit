"use client";

import { formatDateTime, formatMoney } from "@/lib/format";

export function UtilisationList({ utilisation }: { utilisation?: any[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Class utilisation</h2>
      <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
        {utilisation?.map((c) => (
          <div key={c.id} className="flex items-center gap-4 p-3 text-sm">
            <span className="flex-1">{c.name}</span>
            <span className="muted">{formatDateTime(c.startsAt)}</span>
            <span className="muted">
              {c.booked}/{c.capacity}
            </span>
            <span style={{ color: c.utilisation > 0.8 ? "var(--accent)" : undefined }}>
              {Math.round(c.utilisation * 100)}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecentPayments({ payments }: { payments?: any[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Recent payments</h2>
      <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
        {payments?.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-3 text-sm">
            <span className="flex-1">{p.memberName}</span>
            <span className="muted">{p.method}</span>
            <span className="muted">{p.status}</span>
            <span>{formatMoney(p.amountCents)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}