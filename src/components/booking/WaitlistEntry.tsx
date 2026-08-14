"use client";

import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/common/Badge";

interface WaitlistEntryProps {
  bookingId: number;
  className: string;
  startsAt: string;
  room: string;
  durationMin: number;
  position: number;
  cancelPending: boolean;
  onLeave: (bookingId: number) => void;
}

export function WaitlistEntry({
  bookingId,
  className,
  startsAt,
  room,
  durationMin,
  position,
  cancelPending,
  onLeave,
}: WaitlistEntryProps) {
  return (
    <div className="panel flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{className}</h3>
          <Badge>#{position} in queue</Badge>
        </div>
        <p className="muted mt-0.5 text-sm">
          {formatDateTime(startsAt)} &middot; {room} &middot; {durationMin} min
        </p>
      </div>

      <button
        className="btn"
        disabled={cancelPending}
        onClick={() => onLeave(bookingId)}
      >
        Leave waitlist
      </button>
    </div>
  );
}