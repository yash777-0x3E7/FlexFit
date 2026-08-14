"use client";

import { formatDateTime } from "@/lib/format";

interface BookingCardProps {
  booking: {
    id: number;
    className: string;
    startsAt: string;
    room: string;
    status: string;
  };
  cancelPending: boolean;
  onReschedule: () => void;
  onCancel: (bookingId: number) => void;
}

const BADGE_CLASS: Record<string, string> = {
  booked: "badge-emerald",
  waitlisted: "badge-amber",
  attended: "badge-cyan",
  cancelled: "badge-rose",
};

export function BookingCard({
  booking,
  cancelPending,
  onReschedule,
  onCancel,
}: BookingCardProps) {
  const isActive = booking.status === "booked" || booking.status === "waitlisted";

  return (
    <div className="panel panel-hover flex items-center justify-between gap-4 p-5 flex-wrap sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-lg text-white tracking-tight">{booking.className}</h3>
          <span className={`badge ${BADGE_CLASS[booking.status] ?? "badge-cyan"} capitalize`}>
            {booking.status}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            📅 {formatDateTime(booking.startsAt)}
          </span>
          <span>&bull;</span>
          <span className="text-slate-400">📍 {booking.room}</span>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-2.5 w-full sm:w-auto mt-2 sm:mt-0">
          {booking.status === "booked" && (
            <button
              className="btn btn-sm flex-1 sm:flex-none border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
              disabled={cancelPending}
              onClick={onReschedule}
            >
              Reschedule
            </button>
          )}
          <button
            className="btn btn-sm btn-danger flex-1 sm:flex-none"
            disabled={cancelPending}
            onClick={() => onCancel(booking.id)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}