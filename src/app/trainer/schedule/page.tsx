"use client";

import { trpc } from "@/lib/trpc";
import { Loading } from "@/components/common/Feedback";
import { PageHeader } from "@/components/common/PageHeader";
import { TrainerClassCard } from "@/components/trainer/TrainerClassCard";
import { AvailabilityEditor } from "@/components/trainer/AvailabilityEditor";

export default function TrainerSchedulePage() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: classes, isLoading: classesLoading } =
    trpc.trainers.upcomingClasses.useQuery(undefined, {
      enabled: user?.role === "trainer",
    });
  const { data: availability, isLoading: availLoading } =
    trpc.trainers.availability.useQuery(undefined, {
      enabled: user?.role === "trainer",
    });

  if (user?.role !== "trainer") {
    return <p className="muted">Access denied. Trainers only.</p>;
  }

  const isLoading = classesLoading || availLoading;

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trainer Schedule"
        description="Manage your availability and upcoming classes"
      />

      <section className="space-y-3">
        <h2 className="font-medium">Upcoming Classes</h2>
        {classes && classes.length > 0 ? (
          <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
            {classes.map((cls) => (
              <TrainerClassCard
                key={cls.id}
                classId={cls.id}
                className={cls.name}
                startsAt={cls.startsAt}
                room={cls.room}
                durationMin={cls.durationMin}
                cancelled={cls.cancelled}
              />
            ))}
          </div>
        ) : (
          <p className="muted text-sm">No upcoming classes.</p>
        )}
      </section>

      <AvailabilityEditor availability={availability} />
    </div>
  );
}