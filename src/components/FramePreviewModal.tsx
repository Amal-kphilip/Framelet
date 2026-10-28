"use client";

import React from "react";
import Image from "next/image";
import { X, Download, Check, Copy } from "lucide-react";
import { ExtractedFrame } from "@/types";
import { downloadSingleFrame } from "@/lib/zipExporter";
import { formatBytes } from "@/lib/videoUtils";
import Typography from "./Typography";

interface FramePreviewModalProps {
  frame: ExtractedFrame | null;
  videoName: string;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
}

export const FramePreviewModal: React.FC<FramePreviewModalProps> = ({
  frame,
  videoName,
  onClose,
  onToggleSelect,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const copyTimerRef = React.useRef<number | null>(null);
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const isOpen = frame !== null;

  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    const focusAnimation = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="frame-preview-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full max-h-[92dvh] overflow-y-auto border-2 border-foreground rounded-corner bg-background shadow-none p-4 sm:p-[var(--space-xl)] flex flex-col gap-4 sm:gap-[var(--space-lg)] outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-[var(--space-md)] pb-[var(--space-md)] border-b-2 border-border">
          <div className="flex flex-col gap-[var(--space-xs)]">
            <Typography as="h2" id="frame-preview-title" variant="label" weight={600}>
              Frame #{frame.index}
            </Typography>
            <Typography as="p" variant="bodySm" muted className="font-mono">
              {`${frame.formattedTime} · ${frame.width} × ${frame.height} · ${formatBytes(frame.sizeBytes)}`}
            </Typography>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close frame preview"
            className="size-9 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Original Aspect Image Container */}
        <div className="relative rounded-corner border-2 border-foreground bg-secondary overflow-hidden max-h-[65vh] flex items-center justify-center">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => onToggleSelect(frame.id)}
            className={`text-xs sm:text-sm font-semibold h-10 px-4 w-full sm:w-auto rounded-corner border-2 border-foreground inline-flex items-center justify-center gap-2 transition-colors ${
              frame.selected
                ? "bg-foreground text-background"
                : "bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Check className="size-4 shrink-0" />
            <span>{frame.selected ? "Selected for ZIP" : "Select frame"}</span>
          </button>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs sm:text-sm font-semibold h-10 px-3 sm:px-4 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
              <span>{copied ? "Copied!" : copyError ? "Unavailable" : "Copy image"}</span>
            </button>

            <button
              type="button"
              onClick={() => downloadSingleFrame(frame, videoName)}
              className="text-xs sm:text-sm font-semibold h-10 px-3 sm:px-5 rounded-corner border-2 border-foreground bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Download className="size-4 shrink-0" />
              <span>Save frame</span>
            </button>
          </div>
        </div>

        {copyError && (
          <Typography as="p" variant="legal" muted className="text-right">
            Image clipboard access is not supported here. Use “Save frame” instead.
          </Typography>
        )}
      </div>
    </div>
  );
};
