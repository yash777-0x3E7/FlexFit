"use client";

import type { ReactNode } from "react";

export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 500,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="panel space-y-4 p-6"
        style={{ maxWidth, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}