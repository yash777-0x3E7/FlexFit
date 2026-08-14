"use client";

import { trpc } from "@/lib/trpc";
import { Loading, ErrorBanner } from "@/components/common/Feedback";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { WaitlistEntry } from "@/components/booking/WaitlistEntry";

export default function WaitlistPage() {
  const utils = trpc.useUtils();
  const { data: waitlisted, isLoading } = trpc.bookings.waitlisted.useQuery();
  const cancel = trpc.bookings.cancel.useMutation({
    onSuccess: async () => {
      await utils.bookings.waitlisted.invalidate();
      await utils.bookings.mine.invalidate();
      await utils.classes.list.invalidate();
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        description="Classes you're waitlisted for"
      />

      {cancel.error && <ErrorBanner message={cancel.error.message} />}

      {waitlisted?.length ? (
        <div className="space-y-2">
          {waitlisted.map((w) => (
            <WaitlistEntry
              key={w.bookingId}
              bookingId={w.bookingId}
              className={w.className}
              startsAt={w.startsAt}
              room={w.room}
              durationMin={w.durationMin}
              position={w.position}
              cancelPending={cancel.isPending}
              onLeave={(id) => cancel.mutate({ bookingId: id })}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="You're not waitlisted for any classes." />
      )}
    </div>
  );
}