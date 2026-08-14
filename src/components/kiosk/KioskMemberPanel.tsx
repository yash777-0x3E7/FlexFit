"use client";

import { formatDateTime } from "@/lib/format";

function MembershipWarning({ message }: { message: string }) {
  return (
    <div
      className="rounded border p-3 text-sm"
      style={{ borderColor: "#dc2626", background: "#7f1d1d", color: "#fca5a5" }}
    >
      ⚠ {message}
    </div>
  );
}

export function KioskMemberPanel({
  memberName,
  onClear,
  expired,
  noCredits,
  classes,
  isLoading,
  checkinPending,
  onCheckin,
}: {
  memberName: string;
  onClear: () => void;
  expired: boolean;
  noCredits: boolean;
  classes: any[];
  isLoading: boolean;
  checkinPending: boolean;
  onCheckin: (bookingId: number) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Member: {memberName}</h2>
        <button
          onClick={onClear}
          className="btn btn-sm"
          style={{
            background: "var(--bg-secondary)",
            color: "var(--fg)",
            borderColor: "var(--border)",
          }}
        >
          Change member
        </button>
      </div>

      {(expired || noCredits) && (
        <div className="space-y-2">
          {expired && <MembershipWarning message="Membership has expired" />}
          {noCredits && <MembershipWarning message="No credits remaining" />}
        </div>
      )}

      {isLoading && <p className="muted text-sm">Loading classes...</p>}
      {classes.length === 0 && (
        <p className="muted text-sm">No classes in the next 2 hours</p>
      )}
      {classes.length > 0 && (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {classes.map((cls) => (
            <div key={cls.bookingId} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{cls.className}</div>
                  <div className="muted mt-1 text-sm">
                    {formatDateTime(cls.startsAt)} · {cls.room} · {cls.durationMin} min
                  </div>
                  {cls.trainerName && (
                    <div className="muted text-xs mt-1">Trainer: {cls.trainerName}</div>
                  )}
                </div>
                <button
                  onClick={() => onCheckin(cls.bookingId)}
                  disabled={checkinPending || expired || noCredits}
                  className="btn btn-primary btn-sm ml-4"
                >
                  Check in
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}