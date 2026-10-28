"use client";

import React, { useState } from "react";
import { Archive, Loader2, CheckCheck, X } from "lucide-react";
import { ExtractedFrame } from "@/types";
import { exportFramesToZip, ZipExportProgress } from "@/lib/zipExporter";
import { formatBytes } from "@/lib/videoUtils";
import Typography from "./Typography";

interface FloatingActionBarProps {
  frames: ExtractedFrame[];
  videoName: string;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onError: (title: string, message: string) => void;
  onSuccess: (title: string, message: string) => void;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({
  frames,
  videoName,
  onSelectAll,
  onDeselectAll,
  onError,
  onSuccess,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ZipExportProgress | null>(null);

  const selectedFrames = frames.filter((f) => f.selected);
  const selectedCount = selectedFrames.length;
  const selectedBytes = selectedFrames.reduce((total, frame) => total + frame.sizeBytes, 0);

  if (selectedCount === 0) return null;

  const handleDownloadZip = async () => {
    if (selectedCount === 0) return;

    setIsExporting(true);
    setExportProgress({
      percent: 5,
      current: 0,
      total: selectedCount,
      status: "Starting archive packaging...",
    });

    try {
      await exportFramesToZip(
        selectedFrames,
        videoName,
        (progress) => {
          setExportProgress(progress);
        },
        frames.length
      );

      onSuccess(
        "Download ready",
        `Bundled ${selectedCount} frame${selectedCount === 1 ? "" : "s"} into ZIP.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate ZIP archive";
      onError("Download Error", msg);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <div className="pointer-events-auto rounded-corner border-2 border-foreground bg-background p-2 sm:px-4 sm:py-3 flex items-center justify-between gap-2 sm:gap-6 max-w-2xl w-full sm:w-auto">
        {/* Selected Count Info */}
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-corner border-2 border-foreground bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs shrink-0">
            {selectedCount}
          </div>
          <div className="hidden sm:block">
            <Typography as="span" variant="bodySm" weight={600} className="block leading-tight">
              {selectedCount} {selectedCount === 1 ? "frame" : "frames"} selected
            </Typography>
            <Typography as="span" variant="legal" muted className="block leading-tight font-mono">
              {formatBytes(selectedBytes)}
            </Typography>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={isExporting}
            title="Select all frames"
            className="text-xs font-semibold h-9 px-2.5 sm:px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="size-4" />
            <span className="hidden md:inline">All</span>
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            disabled={isExporting}
            title="Clear selection"
            aria-label="Clear selection"
            className="size-9 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ZIP Export Button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleDownloadZip}
          className="text-xs sm:text-sm font-semibold h-9 sm:h-10 px-3 sm:px-5 rounded-corner border-2 border-foreground bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 sm:gap-2 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {isExporting ? (
            <>
              <Loader2 className="size-4 animate-spin shrink-0" />
              <span className="hidden sm:inline">{exportProgress?.status || "Bundling ZIP..."}</span>
              <span className="sm:hidden">
                {exportProgress?.percent ? `${exportProgress.percent}%` : "Bundling..."}
              </span>
            </>
          ) : (
            <>
              <Archive className="size-4 shrink-0" />
              <span>ZIP ({selectedCount})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
