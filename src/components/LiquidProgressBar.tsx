"use client";

import React from "react";
import { Loader2, X } from "lucide-react";

interface LiquidProgressBarProps {
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  statusText?: string;
  onCancel?: () => void;
}

export const LiquidProgressBar: React.FC<LiquidProgressBarProps> = ({
  progress,
  currentFrame = 0,
  totalFrames = 0,
  statusText = "Extracting video frames...",
  onCancel,
}) => {
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <section
      aria-labelledby="framelet-progress-title"
      className="glass w-full border border-brand-border rounded-3xl p-5 sm:p-6 flex flex-col gap-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center shrink-0">
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none text-brand-accentText"
              aria-hidden="true"
            />
          </div>
          <div>
            <h3 id="framelet-progress-title" className="text-sm font-semibold text-foreground">
              {statusText}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              {totalFrames > 0
                ? `${Math.min(currentFrame, totalFrames).toLocaleString()} of ${totalFrames.toLocaleString()} frames (${roundedProgress}%)`
                : `${roundedProgress}% complete`}
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel frame extraction"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground transition-colors"
          >
            <X className="size-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Accent progress bar */}
      <div
        role="progressbar"
        aria-label="Frame extraction progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedProgress}
        aria-valuetext={`${roundedProgress}% complete`}
        className="w-full h-3 border border-brand-border rounded-full bg-secondary overflow-hidden"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff6a2b] to-[#ff8547] transition-[width] duration-150 ease-out motion-reduce:transition-none"
          style={{ width: `${roundedProgress}%` }}
        />
      </div>
    </section>
  );
};
