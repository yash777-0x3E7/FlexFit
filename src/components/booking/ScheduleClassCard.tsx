"use client";

import { formatDateTime } from "@/lib/format";

interface ScheduleClassCardProps {
  id: number;
  name: string;
  startsAt: string;
  room: string;
  trainerName?: string | null;
  durationMin: number;
  full: boolean;
  spotsLeft: number;
  capacity: number;
  creditCost: number;
  bookDisabled: boolean;
  bookPending: boolean;
  onBook: (classId: number) => void;
}

export function ScheduleClassCard({
  id,
  name,
  startsAt,
  room,
  trainerName,
  durationMin,
  full,
  spotsLeft,
  capacity,
  creditCost,
  bookDisabled,
  bookPending,
  onBook,
}: ScheduleClassCardProps) {
  const percentageLeft = Math.round((spotsLeft / capacity) * 100);

  return (
    <div className="panel panel-hover flex items-center justify-between gap-4 p-5 flex-wrap sm:flex-nowrap">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-lg text-white tracking-tight">{name}</h2>
          {full ? (
            <span className="badge badge-amber">Waitlist Open</span>
          ) : (
            <span className="badge badge-emerald">{spotsLeft} spots available</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-slate-400 flex-wrap">
          <span className="text-slate-200">🕒 {formatDateTime(startsAt)}</span>
          <span>&bull;</span>
          <span>📍 {room}</span>
          <span>&bull;</span>
          <span>🏋️ {trainerName ?? "Staff Trainer"}</span>
          <span>&bull;</span>
          <span>⏱️ {durationMin} min</span>
        </div>
      </div>

      <div className="flex items-center gap-5 w-full sm:w-auto justify-between sm:justify-end">
        <div className="text-right">
          <div className="text-sm font-bold text-cyan-400">
            {creditCost} {creditCost === 1 ? "credit" : "credits"}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            {spotsLeft} of {capacity} remaining
          </div>
        </div>

        <button
          className={`btn ${full ? "btn-sm border-amber-500/30 text-amber-300 hover:bg-amber-500/10" : "btn-primary"}`}
          disabled={bookDisabled || bookPending}
          onClick={() => onBook(id)}
        >
          {full ? "Join waitlist" : "Book Class"}
        </button>
      </div>
    </div>
  );
}