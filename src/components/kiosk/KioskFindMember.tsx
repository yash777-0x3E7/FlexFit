"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function KioskFindMember({
  query,
  onQuery,
  onSelect,
}: {
  query: string;
  onQuery: (q: string) => void;
  onSelect: (member: any) => void;
}) {
  const lookup = trpc.members.lookupByEmailOrPhone.useQuery(
    { query },
    { enabled: !!query && query.length > 2 },
  );

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Find Member</h2>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Email or phone number"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--fg)",
          }}
        />
      </div>

      {lookup.isLoading && <p className="muted text-sm">Searching...</p>}
      {lookup.error && (
        <p className="text-sm" style={{ color: "#ef4444" }}>
          Member not found
        </p>
      )}
      {lookup.data && (
        <div className="panel p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{lookup.data.name}</div>
              <div className="muted text-xs mt-1">{lookup.data.email}</div>
              {lookup.data.phone && (
                <div className="muted text-xs">{lookup.data.phone}</div>
              )}
            </div>
            <button
              onClick={() => onSelect(lookup.data)}
              className="btn btn-primary btn-sm"
            >
              Select
            </button>
          </div>
        </div>
      )}
    </section>
  );
}