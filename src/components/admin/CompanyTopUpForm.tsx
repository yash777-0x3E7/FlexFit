"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function CompanyTopUpForm({
  companyId,
  onSuccess,
  onCancel,
}: {
  companyId: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState("");
  const topUp = trpc.adminCompanies.topUp.useMutation({
    onSuccess: () => {
      setAmount("");
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(amount);
    if (parsed > 0) topUp.mutate({ id: companyId, amount: parsed });
  };

  return (
    <div className="panel p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Top Up Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            style={{ borderColor: "var(--border)" }}
            placeholder="Number of credits"
            disabled={topUp.isPending}
            min="1"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn"
            disabled={topUp.isPending || !amount}
          >
            {topUp.isPending ? "Processing..." : "Top Up"}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={topUp.isPending}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}