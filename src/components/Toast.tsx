"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { ToastMessage } from "@/types";
import Typography from "./Typography";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 z-50 flex flex-col gap-2 max-w-full sm:max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        onDismiss(toast.id);
      },
      toast.type === "error" ? 5000 : 3200
    );
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  const bgColors: Record<ToastMessage["type"], string> = {
    error: "bg-[var(--toast-error)]",
    success: "bg-[var(--toast-success)]",
    warning: "bg-[var(--toast-warning)]",
    info: "bg-[var(--toast-info)]",
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto select-none cursor-pointer w-full border-2 border-[var(--toast-border)] text-[var(--toast-text)] rounded-corner px-[var(--space-lg)] py-[var(--space-md)] flex items-start justify-between gap-3 ${bgColors[toast.type]}`}
    >
      <div className="flex-1 min-w-0">
        <Typography as="h5" variant="bodySm" weight={600} className="text-[var(--toast-text)] leading-tight">
          {toast.title}
        </Typography>
        <Typography as="p" variant="legal" className="text-[var(--toast-text)] opacity-90 mt-0.5 leading-snug break-words">
          {toast.message}
        </Typography>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(toast.id);
        }}
        aria-label={`Dismiss notification: ${toast.title}`}
        className="shrink-0 size-6 inline-flex items-center justify-center rounded-corner border-2 border-[var(--toast-border)] bg-transparent text-[var(--toast-text)] hover:opacity-70 transition-opacity"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};
