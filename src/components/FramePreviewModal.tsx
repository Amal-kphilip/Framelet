"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Clock, Check, Copy } from "lucide-react";
import { ExtractedFrame } from "@/types";
import { downloadSingleFrame } from "@/lib/zipExporter";
import { formatBytes } from "@/lib/videoUtils";

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
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="frame-preview-title"
          tabIndex={-1}
          className="relative max-w-5xl w-full max-h-[92dvh] overflow-y-auto rounded-3xl glass-panel border border-white/20 shadow-2xl p-4 sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span id="frame-preview-title" className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-xs font-mono text-sky-400 font-bold">
                Frame #{frame.index}
              </span>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-mono">{frame.formattedTime}</span>
                <span className="text-white/30">•</span>
                <span className="font-mono">{frame.width} × {frame.height}</span>
                <span className="text-white/30">•</span>
                <span>{formatBytes(frame.sizeBytes)}</span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close frame preview"
              className="min-w-10 min-h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Large Image Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 max-h-[65vh] flex items-center justify-center">
            <Image
              src={frame.dataUrl}
              alt={`Video frame ${frame.index} at ${frame.formattedTime}`}
              width={frame.width}
              height={frame.height}
              unoptimized
              className="max-h-[65vh] max-w-full w-auto object-contain"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 mt-2">
            <button
              onClick={() => onToggleSelect(frame.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
                frame.selected
                  ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${frame.selected ? "opacity-100" : "opacity-40"}`} />
              <span>{frame.selected ? "Selected for ZIP" : "Add to Selection"}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 transition-all flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Image!" : copyError ? "Clipboard Unavailable" : "Copy Image"}</span>
              </button>

              <button
                onClick={() => downloadSingleFrame(frame, videoName)}
                className="liquid-gradient-btn px-5 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Frame</span>
              </button>
            </div>
          </div>
          {copyError && <p role="status" className="text-[11px] text-amber-200/90 mt-2 text-right">Image clipboard access is not supported here. Use “Save Frame” instead.</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
