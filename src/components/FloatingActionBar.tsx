"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Archive, Download, Check, Sparkles, Loader2, CheckCheck, X } from "lucide-react";
import confetti from "canvas-confetti";
import { ExtractedFrame } from "@/types";
import { exportFramesToZip, ZipExportProgress } from "@/lib/zipExporter";

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
      await exportFramesToZip(selectedFrames, videoName, (progress) => {
        setExportProgress(progress);
      });

      // Trigger Apple-inspired confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.85 },
        colors: ["#38bdf8", "#a855f7", "#ec4899", "#34d399", "#ffffff"],
      });

      onSuccess(
        "ZIP Download Ready!",
        `Successfully bundled ${selectedCount} high-resolution frames into a ZIP archive.`
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
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto rounded-full p-2 sm:px-4 sm:py-2.5 glass-dock flex items-center gap-3 sm:gap-6 shadow-2xl max-w-2xl w-full sm:w-auto justify-between border border-white/20">
            {/* Selected Count Pill */}
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-bold text-xs shadow-[0_0_12px_rgba(56,189,248,0.4)]">
                {selectedCount}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-semibold text-white/95 block leading-none">
                  {selectedCount} {selectedCount === 1 ? "Frame" : "Frames"} Selected
                </span>
                <span className="text-[10px] text-white/50 leading-none">
                  Ready to download
                </span>
              </div>
            </div>

            {/* Middle Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onSelectAll}
                disabled={isExporting}
                title="Select All"
                className="px-2.5 py-1.5 rounded-full text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden md:inline">All</span>
              </button>
              <button
                onClick={onDeselectAll}
                disabled={isExporting}
                title="Clear Selection"
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prominent ZIP Download Button */}
            <motion.button
              whileHover={{ scale: isExporting ? 1 : 1.03 }}
              whileTap={{ scale: isExporting ? 1 : 0.97 }}
              disabled={isExporting}
              onClick={handleDownloadZip}
              className="liquid-gradient-btn px-5 py-2.5 rounded-full text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg disabled:opacity-60 whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{exportProgress?.status || "Bundling ZIP..."}</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-white" />
                  <span>Download ZIP ({selectedCount})</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
