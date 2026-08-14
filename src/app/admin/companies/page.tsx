"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loading } from "@/components/common/Feedback";
import { PageHeader } from "@/components/common/PageHeader";
import { CompanyForm } from "@/components/admin/CompanyForm";

export default function CompaniesPage() {
  const { data: companies, isLoading } = trpc.adminCompanies.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader title="Corporate Memberships">
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn btn-sm">
            New Company
          </button>
        )}
      </PageHeader>

      {success && (
        <div className="p-3 rounded" style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}>
          <p style={{ color: "var(--accent)" }}>Company created successfully!</p>
        </div>
      )}

      {showForm && (
        <CompanyForm
          onSuccess={() => {
            setShowForm(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="panel divide-y" style={{ borderColor: "var(--border)" }}>
        {companies && companies.length > 0 ? (
          companies.map((c) => (
            <Link
              key={c.id}
              href={`/admin/companies/${c.id}`}
              className="flex items-center gap-4 p-4 hover:opacity-75 transition"
            >
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm muted">{c.contactEmail}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{c.creditPoolBalance} credits</div>
                <div className={`text-sm ${c.active ? "text-green-600" : "text-red-600"}`}>
                  {c.active ? "Active" : "Inactive"}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-4 text-center muted">No companies yet</div>
        )}
      </div>
    </div>
  );
}