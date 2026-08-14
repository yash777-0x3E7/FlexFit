"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function LinkMemberForm({
  companyId,
  excludedMemberIds,
  onSuccess,
  onCancel,
}: {
  companyId: number;
  excludedMemberIds: number[];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const { data: searchData } = trpc.members.search.useQuery(
    { q: query },
    { enabled: query.length > 2 },
  );
  const link = trpc.adminCompanies.linkMember.useMutation({
    onSuccess: () => {
      setQuery("");
      onSuccess();
    },
  });

  const candidates = (searchData || []).filter(
    (u: any) => !excludedMemberIds.includes(u.id),
  );

  return (
    <div className="panel p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium mb-2">Search Members</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          style={{ borderColor: "var(--border)" }}
          placeholder="Search by name or email (3+ chars)"
          disabled={link.isPending}
        />
      </div>

      {candidates.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {candidates.map((user: any) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 border rounded"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs muted">{user.email}</div>
              </div>
              <button
                onClick={() => link.mutate({ companyId, userId: user.id })}
                className="btn btn-sm"
                disabled={link.isPending}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn-outline"
        onClick={onCancel}
        disabled={link.isPending}
      >
        Done
      </button>
    </div>
  );
}