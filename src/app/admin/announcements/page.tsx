"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";

export default function AnnouncementsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Broadcast Announcement" />
      <AnnouncementForm />
    </div>
  );
}