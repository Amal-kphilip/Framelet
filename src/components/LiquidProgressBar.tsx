"use client";

import React from "react";
import { Loader2, X } from "lucide-react";
import Typography from "./Typography";

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
      className="w-full border-2 border-foreground rounded-corner bg-background p-[var(--space-xl)] flex flex-col gap-[var(--space-md)]"
    >
      <div className="flex items-center justify-between gap-[var(--space-md)]">
        <div className="flex items-center gap-[var(--space-md)]">
          <Loader2 className="size-5 animate-spin text-foreground shrink-0" />
          <div>
            <Typography as="h3" id="framelet-progress-title" variant="label" weight={600}>
              {statusText}
            </Typography>
            <Typography as="p" variant="legal" muted>
              {totalFrames > 0
                ? `${Math.min(currentFrame, totalFrames).toLocaleString()} of ${totalFrames.toLocaleString()} frames (${roundedProgress}%)`
                : `${roundedProgress}% complete`}
            </Typography>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel frame extraction"
            className="type-fluid type-button inline-flex items-center gap-1.5 h-9 px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors"
          >
            <X className="size-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Crisp flat progress bar */}
      <div
        role="progressbar"
        aria-label="Frame extraction progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedProgress}
        aria-valuetext={`${roundedProgress}% complete`}
        className="w-full h-4 border-2 border-foreground rounded-corner bg-secondary overflow-hidden"
      >
        <div
          className="h-full bg-foreground transition-[width] duration-150 ease-out"
          style={{ width: `${roundedProgress}%` }}
        />
      </div>
    </section>
  );
};
