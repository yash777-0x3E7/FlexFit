"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function CompanyForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState("0");
  const [error, setError] = useState("");

  const utils = trpc.useUtils();
  const create = trpc.adminCompanies.create.useMutation({
    onSuccess: async () => {
      await utils.adminCompanies.list.invalidate();
      onSuccess();
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    create.mutate({
      name: name.trim(),
      contactEmail: email.trim(),
      creditPoolBalance: parseInt(credits) || 0,
    });
  };

  return (
    <div className="panel p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Create New Company</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="e.g. TechCorp Inc"
            disabled={create.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="contact@techcorp.com"
            disabled={create.isPending}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Initial Credit Pool</label>
          <input
            type="number"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="0"
            disabled={create.isPending}
            min="0"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="btn"
            disabled={create.isPending || !name.trim() || !email.trim()}
          >
            {create.isPending ? "Creating..." : "Create Company"}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={create.isPending}
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="p-3 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
            <p style={{ color: "#ef4444" }}>{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}