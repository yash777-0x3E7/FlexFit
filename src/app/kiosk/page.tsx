"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/common/PageHeader";
import { KioskFindMember } from "@/components/kiosk/KioskFindMember";
import { KioskMemberPanel } from "@/components/kiosk/KioskMemberPanel";

export default function KioskPage() {
  const { data: user } = trpc.auth.me.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [checkinSuccess, setCheckinSuccess] = useState<{
    memberName: string;
    className: string;
  } | null>(null);

  if (user?.role !== "admin" && user?.role !== "trainer") {
    return <p className="muted">Access denied. Staff only.</p>;
  }

  const upcomingClasses = trpc.bookings.upcomingForMember.useQuery(
    { userId: selectedMember?.id || 0, hoursAhead: 2 },
    { enabled: !!selectedMember },
  );

  const memberDetails = trpc.members.byId.useQuery(
    { id: selectedMember?.id || 0 },
    { enabled: !!selectedMember },
  );

  const markAttended = trpc.bookings.markAttended.useMutation({
    onSuccess: (_, variables) => {
      const classInfo = upcomingClasses.data?.find(
        (c) => c.bookingId === variables.bookingId,
      );
      if (classInfo && selectedMember) {
        setCheckinSuccess({
          memberName: selectedMember.name,
          className: classInfo.className,
        });
        setTimeout(() => {
          setCheckinSuccess(null);
          setSearchQuery("");
          setSelectedMember(null);
        }, 3000);
        upcomingClasses.refetch();
      }
    },
  });

  const memberships = memberDetails.data?.memberships || [];
  const isMembershipExpired =
    memberships.length > 0
      ? new Date(memberships[0].endDate) < new Date()
      : false;
  const hasNoCredits = memberships[0]?.creditsRemaining === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Check-in Kiosk"
        description="Look up a member and check them in to upcoming classes"
      />

      {checkinSuccess && (
        <div
          className="rounded border p-4"
          style={{ borderColor: "#16a34a", background: "#064e3b", color: "#bbf7d0" }}
        >
          <div className="font-medium">✓ Check-in successful</div>
          <div className="muted mt-1 text-sm">
            {checkinSuccess.memberName} checked in to {checkinSuccess.className}
          </div>
        </div>
      )}

      {!selectedMember && (
        <KioskFindMember
          query={searchQuery}
          onQuery={setSearchQuery}
          onSelect={setSelectedMember}
        />
      )}

      {selectedMember && (
        <KioskMemberPanel
          memberName={selectedMember.name}
          onClear={() => {
            setSelectedMember(null);
            setSearchQuery("");
          }}
          expired={isMembershipExpired}
          noCredits={hasNoCredits}
          classes={upcomingClasses.data || []}
          isLoading={upcomingClasses.isLoading}
          checkinPending={markAttended.isPending}
          onCheckin={(bookingId) =>
            markAttended.mutate({ bookingId, source: "kiosk" })
          }
        />
      )}
    </div>
  );
}