"use client";

import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Loading, ErrorBanner } from "@/components/common/Feedback";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ScheduleClassCard } from "@/components/booking/ScheduleClassCard";

export default function SchedulePage() {
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();
  const from = useMemo(() => new Date().toISOString(), []);
  const { data: classes, isLoading } = trpc.classes.list.useQuery({ from });

  const book = trpc.bookings.book.useMutation({
    onSuccess: async () => {
      await utils.classes.list.invalidate();
      await utils.bookings.mine.invalidate();
    },
  });

  if (isLoading) return <Loading label="Loading schedule..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class schedule"
        description={`${classes?.length ?? 0} upcoming classes`}
      />

      {book.error && <ErrorBanner message={book.error.message} />}

      <div className="space-y-2">
        {classes?.map((c) => (
          <ScheduleClassCard
            key={c.id}
            id={c.id}
            name={c.name}
            startsAt={c.startsAt}
            room={c.room}
            trainerName={c.trainerName}
            durationMin={c.durationMin}
            full={c.full}
            spotsLeft={c.spotsLeft}
            capacity={c.capacity}
            creditCost={c.creditCost}
            bookDisabled={!user}
            bookPending={book.isPending}
            onBook={(id) => book.mutate({ classId: id })}
          />
        ))}
        {classes?.length === 0 && <EmptyState message="No upcoming classes." />}
      </div>

      {!user && <p className="muted text-sm">Sign in to book a class.</p>}
    </div>
  );
}