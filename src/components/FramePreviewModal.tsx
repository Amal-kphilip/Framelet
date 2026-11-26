"use client";

import React from "react";
import Image from "next/image";
import { X, Download, Check, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { ExtractedFrame } from "@/types";
import { downloadSingleFrame } from "@/lib/zipExporter";
import { formatBytes } from "@/lib/videoUtils";

interface FramePreviewModalProps {
  frame: ExtractedFrame | null;
  videoName: string;
  filenameTemplate?: string;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
  onNavigate?: (direction: "prev" | "next") => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const FramePreviewModal: React.FC<FramePreviewModalProps> = ({
  frame,
  videoName,
  filenameTemplate,
  onClose,
  onToggleSelect,
  onNavigate,
  hasPrev = false,
  hasNext = false,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const copyTimerRef = React.useRef<number | null>(null);
  const onCloseRef = React.useRef(onClose);
  const onNavigateRef = React.useRef(onNavigate);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  const isOpen = frame !== null;

  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusAnimation = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onNavigateRef.current?.("prev");
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onNavigateRef.current?.("next");
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusAnimation);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!frame) return null;

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("Clipboard image writing is not supported in this browser.");
      }
      const item = new ClipboardItem({ [frame.blob.type || "image/png"]: frame.blob });
      await navigator.clipboard.write([item]);
      setCopyError(false);
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frame-preview-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="glass relative max-w-4xl w-full max-h-[92dvh] overflow-y-auto border border-brand-border rounded-3xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-brand-border">
          <div className="flex flex-col gap-0.5">
            <h2
              id="frame-preview-title"
              className="font-display font-700 text-base sm:text-lg text-foreground"
            >
              Frame #{frame.index}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">
              {`${frame.formattedTime} · ${frame.width} × ${frame.height} · ${formatBytes(frame.sizeBytes)}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onNavigate && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate("prev")}
                  disabled={!hasPrev}
                  aria-label="Previous frame"
                  title="Previous frame (Left arrow)"
                  className="size-9 inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-foreground transition-colors disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("next")}
                  disabled={!hasNext}
                  aria-label="Next frame"
                  title="Next frame (Right arrow)"
                  className="size-9 inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-foreground transition-colors disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close frame preview"
              className="size-9 inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Original Aspect Image Container */}
        <div className="relative rounded-2xl border border-brand-border bg-brand-surface overflow-hidden max-h-[65vh] flex items-center justify-center">
          <Image
            src={frame.dataUrl}
            alt={`Video frame ${frame.index} at ${frame.formattedTime}`}
            width={frame.width}
            height={frame.height}
            unoptimized
            className="max-h-[65vh] max-w-full w-auto object-contain"
          />
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => onToggleSelect(frame.id)}
            className={`text-xs sm:text-sm font-semibold h-10 px-4 w-full sm:w-auto rounded-full border inline-flex items-center justify-center gap-2 transition-colors ${
              frame.selected
                ? "bg-brand-accent/15 border-brand-accent text-brand-accentText"
                : "border-brand-border bg-brand-card/70 text-foreground hover:border-brand-accent/40"
            }`}
          >
            <Check className="size-4 shrink-0" />
            <span>{frame.selected ? "Selected for ZIP" : "Select frame"}</span>
          </button>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs sm:text-sm font-semibold h-10 px-4 rounded-full border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-foreground inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copied ? (
                <Check className="size-4 shrink-0 text-brand-accentText" />
              ) : (
                <Copy className="size-4 shrink-0" />
              )}
              <span>{copied ? "Copied!" : copyError ? "Unavailable" : "Copy image"}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadSingleFrame(frame, videoName, filenameTemplate)}
              className="text-xs sm:text-sm font-semibold h-10 px-5 rounded-full bg-gradient-to-r from-[#ff6a2b] to-[#ff8547] text-[#0b0b0d] shadow-accent hover:shadow-accent-strong hover:brightness-105 transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Download className="size-4 shrink-0" />
              <span>Save frame</span>
            </button>
          </div>
        </div>

        {copyError && (
          <p className="text-xs text-muted-foreground text-right">
            Image clipboard access is not supported here. Use “Save frame” instead.
          </p>
        )}
      </div>
    </div>
  );
};
