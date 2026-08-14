"use client";

import { trpc } from "@/lib/trpc";
import { Loading } from "@/components/common/Feedback";
import { StatGrid } from "@/components/common/StatTile";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CheckinsByDay,
  TopTrainers,
  NoShows,
} from "@/components/admin/AttendanceReports";

export default function AdminAttendancePage() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: checkinsPerDay, isLoading: checkinsLoading } =
    trpc.admin.checkinsPerDay.useQuery();
  const { data: topTrainers, isLoading: trainersLoading } =
    trpc.admin.topTrainers.useQuery();
  const { data: noShowList, isLoading: noShowLoading } =
    trpc.admin.noShowList.useQuery();

  const isLoading = checkinsLoading || trainersLoading || noShowLoading;

  if (user?.role !== "admin") {
    return <p className="muted">Access denied. Admins only.</p>;
  }

  if (isLoading) return <Loading label="Loading attendance data..." />;

  const totalCheckins = (checkinsPerDay || []).reduce((sum, row) => sum + row.count, 0);

  const tiles = [
    { label: "Total Check-ins (14d)", value: totalCheckins },
    {
      label: "Top Trainer",
      value: topTrainers && topTrainers.length > 0 ? topTrainers[0].trainerName : "N/A",
    },
    { label: "No-shows (14d)", value: noShowList?.length ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance"
        description="Last 14 days of check-ins and class attendance"
      />

      <StatGrid items={tiles} cols="sm:grid-cols-3" />

      <CheckinsByDay rows={checkinsPerDay || []} />
      <TopTrainers trainers={topTrainers || []} />
      <NoShows noShows={noShowList || []} />
    </div>
  );
}