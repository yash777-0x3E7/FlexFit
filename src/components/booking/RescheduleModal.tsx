"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/format";
import { Modal } from "@/components/common/Modal";
import { Badge } from "@/components/common/Badge";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromBookingId: number;
  fromClassName: string;
  fromClassTime: string;
  onSuccess: () => void;
}

export function RescheduleModal({
  isOpen,
  onClose,
  fromBookingId,
  fromClassName,
  fromClassTime,
  onSuccess,
}: RescheduleModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const from = useMemo(() => new Date().toISOString(), []);

  const { data: availableClasses } = trpc.classes.list.useQuery(
    {
      from,
    },
    {
      enabled: isOpen,
    }
  );

  const sameNameClasses = (availableClasses || []).filter(
    (cls) => cls.name === fromClassName
  );

  const reschedule = trpc.reschedules.reschedule.useMutation({
    onSuccess: async () => {
      await utils.bookings.mine.invalidate();
      await utils.bookings.waitlisted.invalidate();
      await utils.reschedules.history.invalidate();
      await utils.classes.list.invalidate();
      setSelectedClassId(null);
      onClose();
      onSuccess();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <h2 className="text-lg font-semibold">Reschedule class</h2>
        <p className="muted mt-1 text-sm">
          Moving: {fromClassName} on {formatDateTime(fromClassTime)}
        </p>
      </div>

      {error && (
        <p style={{ color: "#f87171", fontSize: "0.875rem" }}>{error}</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sameNameClasses.length ? (
          sameNameClasses.map((cls) => (
            <button
              key={cls.id}
              className="panel w-full p-3 text-left"
              onClick={() => setSelectedClassId(cls.id)}
              style={{
                border:
                  selectedClassId === cls.id
                    ? "2px solid #3b82f6"
                    : "1px solid transparent",
              }}
              disabled={reschedule.isPending}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{cls.name}</h3>
                {(cls.full || (cls.spotsLeft ?? 0) === 0) && (
                  <Badge>Waitlist</Badge>
                )}
              </div>
              <p className="muted text-xs mt-1">
                {formatDateTime(cls.startsAt)} • {cls.room}
              </p>
            </button>
          ))
        ) : (
          <p className="muted text-sm text-center py-4">
            No other {fromClassName} classes available
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button className="btn" disabled={reschedule.isPending} onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={!selectedClassId || reschedule.isPending}
          onClick={() => {
            if (selectedClassId) {
              reschedule.mutate({
                fromBookingId,
                toClassId: selectedClassId,
              });
            }
          }}
        >
          {reschedule.isPending ? "Rescheduling..." : "Reschedule"}
        </button>
      </div>
    </Modal>
  );
}