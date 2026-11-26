"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastMessage } from "@/types";
import { middleTruncate } from "@/lib/uiHelpers";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
  bottomOffset?: number;
}

const DEFAULT_DURATIONS: Record<ToastMessage["type"], number> = {
  info: 3500,
  success: 4000,
  warning: 6000,
  error: 8000,
};

const TYPE_STYLES: Record<
  ToastMessage["type"],
  {
    edge: string;
    iconBg: string;
    bar: string;
    Icon: React.ElementType;
  }
> = {
  success: {
    edge: "border-l-emerald-500",
    iconBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    bar: "bg-emerald-500",
    Icon: CheckCircle2,
  },
  error: {
    edge: "border-l-red-500",
    iconBg: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
    bar: "bg-red-500",
    Icon: AlertCircle,
  },
  warning: {
    edge: "border-l-amber-500",
    iconBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    bar: "bg-amber-500",
    Icon: AlertTriangle,
  },
  info: {
    edge: "border-l-brand-accent",
    iconBg: "bg-brand-accent/15 text-brand-accentText border-brand-accent/30",
    bar: "bg-brand-accent",
    Icon: Info,
  },
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  const reduced = useReducedMotion();

  // Dedupe by type+title+message and stack at most 3
  const visibleToasts = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: ToastMessage[] = [];
    for (let i = toasts.length - 1; i >= 0; i--) {
      const t = toasts[i];
      const key = `${t.type}:${t.title}:${t.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.unshift(t);
      }
      if (unique.length >= 3) break;
    }
    return unique;
  }, [toasts]);

  // Escape dismisses the latest toast
  useEffect(() => {
    if (visibleToasts.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const latest = visibleToasts[visibleToasts.length - 1];
        if (latest) onDismiss(latest.id);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visibleToasts, onDismiss]);

  return (
    <div
      aria-label="Notifications"
      className="fixed top-20 inset-x-3 sm:inset-x-auto sm:right-6 z-50 flex flex-col gap-2.5 sm:w-full sm:max-w-sm pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {visibleToasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} reduced={reduced} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  reduced: boolean | null;
}> = ({ toast, onDismiss, reduced }) => {
  const totalDuration = toast.durationMs ?? DEFAULT_DURATIONS[toast.type];
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const remainingRef = useRef(totalDuration);
  const lastTickRef = useRef<number | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (paused) {
      lastTickRef.current = null;
      return;
    }

    let rafId = 0;
    const tick = (now: number) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      remainingRef.current = Math.max(0, remainingRef.current - delta);
      setProgress((remainingRef.current / totalDuration) * 100);

      if (remainingRef.current <= 0) {
        onDismissRef.current(toast.id);
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [paused, toast.id, totalDuration]);

  const { edge, iconBg, bar, Icon } = TYPE_STYLES[toast.type];
  const isAlert = toast.type === "error" || toast.type === "warning";

  return (
    <motion.div
      layout={!reduced}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
      transition={reduced ? { duration: 0.1 } : { type: "spring", stiffness: 420, damping: 30 }}
      role={isAlert ? "alert" : "status"}
      aria-live={isAlert ? "assertive" : "polite"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto relative overflow-hidden w-full glass rounded-2xl border border-brand-border border-l-[3px] ${edge} shadow-lg px-3.5 py-3 flex items-start gap-3`}
    >
      <div
        className={`size-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h5 className="text-xs sm:text-sm font-semibold text-foreground leading-tight">
          {toast.title}
        </h5>
        {toast.fileName && (
          <p
            className="text-xs font-mono text-brand-accentText mt-0.5 truncate"
            title={toast.fileName}
          >
            {middleTruncate(toast.fileName, 32)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss notification: ${toast.title}`}
        className="shrink-0 size-7 inline-flex items-center justify-center rounded-lg border border-brand-border bg-brand-card/60 text-muted-foreground hover:text-foreground hover:border-brand-accent/40 transition-colors"
      >
        <X className="size-3.5" />
      </button>

      {/* Countdown progress bar */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-border">
        <div className={`h-full ${bar} transition-none`} style={{ width: `${progress}%` }} />
      </div>
    </motion.div>
  );
};
