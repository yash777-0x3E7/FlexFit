"use client";

import { formatDate, formatDateTime } from "@/lib/format";

export function CheckinsByDay({
  rows,
}: {
  rows: { date: string; count: number }[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Check-ins by Day (Last 14 Days)</h2>
      {rows.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((row) => (
            <div
              key={row.date}
              className="flex items-center justify-between p-3 text-sm"
            >
              <span className="muted">{formatDate(row.date)}</span>
              <span className="font-medium">{row.count} check-ins</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No check-in data available.</p>
      )}
    </section>
  );
}

export function TopTrainers({ trainers }: { trainers: any[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Top Trainers by Attended Classes</h2>
      {trainers.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {trainers.map((trainer) => (
            <div key={trainer.trainerId} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{trainer.trainerName}</div>
                  <div className="muted text-xs">{trainer.classCount} classes taught</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{trainer.attendedCount}</div>
                  <div className="muted text-xs">attendees</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No trainer data available.</p>
      )}
    </section>
  );
}

export function NoShows({ noShows }: { noShows: any[] }) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">No-shows (Last 14 Days)</h2>
      {noShows.length > 0 ? (
        <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
          {noShows.map((item) => (
            <div key={item.bookingId} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.memberName}</div>
                  <div className="muted text-xs">{item.memberEmail}</div>
                  <div className="muted text-xs mt-1">{item.className}</div>
                  <div className="muted text-xs">{formatDateTime(item.classDate)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted text-sm">No no-shows in the last 14 days.</p>
      )}
    </section>
  );
}