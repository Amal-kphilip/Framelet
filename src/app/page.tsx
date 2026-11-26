"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { FileVideo, SlidersHorizontal } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { VideoUploadZone } from "@/components/VideoUploadZone";
import { ExtractionControls } from "@/components/ExtractionControls";
import { LiquidProgressBar } from "@/components/LiquidProgressBar";
import { FrameGallery, FrameGallerySkeleton } from "@/components/FrameGallery";
import { FloatingActionBar } from "@/components/FloatingActionBar";
import { FramePreviewModal } from "@/components/FramePreviewModal";
import { ToastContainer } from "@/components/Toast";
import { ShareFunctions } from "@/components/ShareFunctions";
import { Footer } from "@/components/Footer";
import Typography from "@/components/Typography";
import { HeroSection } from "@/components/HeroSection";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FAQSection } from "@/components/FAQSection";
import { ExtractedFrame, ExtractionSettings, ToastMessage, VideoMetadata } from "@/types";
import { captureSingleFrameViaCanvas, extractFramesViaCanvas } from "@/lib/canvasExtractor";
import {
  buildFrameTimestamps,
  calculateScaledDimensions,
  DEFAULT_FILENAME_TEMPLATE,
  estimateOutputBytes,
  hasDuplicateTimestamp,
  MAX_ESTIMATED_OUTPUT_BYTES,
  MAX_EXTRACTED_FRAMES,
} from "@/lib/videoUtils";

export default function Home() {
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [settings, setSettings] = useState<ExtractionSettings>({
    mode: "interval",
    fps: 1,
    interval: 1.0,
    format: "image/jpeg",
    quality: 0.95,
    scale: "original",
    filenameTemplate: DEFAULT_FILENAME_TEMPLATE,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetails, setProgressDetails] = useState({ current: 0, total: 0, status: "" });
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [previewFrame, setPreviewFrame] = useState<ExtractedFrame | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [floatingBarHeight, setFloatingBarHeight] = useState(0);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);

  const extractionControllerRef = useRef<AbortController | null>(null);
  const extractionRunIdRef = useRef(0);
  const videoUrlRef = useRef<string | null>(null);
  const frameUrlsRef = useRef<Set<string>>(new Set());
  const gallerySectionRef = useRef<HTMLDivElement | null>(null);

  const releaseFrameUrls = useCallback(() => {
    frameUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    frameUrlsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      extractionRunIdRef.current += 1;
      extractionControllerRef.current?.abort();
      extractionControllerRef.current = null;
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
      frameUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      frameUrlsRef.current.clear();
    };
  }, []);

  const addToast = useCallback(
    (type: ToastMessage["type"], title: string, message: string, fileName?: string) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => {
        const filtered = prev.filter(
          (t) => !(t.type === type && t.title === title && t.message === message)
        );
        return [...filtered, { id, type, title, message, fileName }].slice(-3);
      });
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleVideoSelected = useCallback(
    (metadata: VideoMetadata) => {
      extractionRunIdRef.current += 1;
      extractionControllerRef.current?.abort();
      extractionControllerRef.current = null;
      if (videoUrlRef.current && videoUrlRef.current !== metadata.url) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      releaseFrameUrls();
      videoUrlRef.current = metadata.url;
      setVideoMetadata(metadata);
      setSettings((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: metadata.duration,
      }));
      setFrames([]);
      setPreviewFrame(null);
      setIsProcessing(false);
      setIsSettingsCollapsed(false);
      setProgress(0);
      setProgressDetails({ current: 0, total: 0, status: "" });
      addToast(
        "success",
        "Video loaded",
        `${metadata.formattedDuration} · ${metadata.width}×${metadata.height}`,
        metadata.name
      );
    },
    [addToast, releaseFrameUrls]
  );

  const handleReset = useCallback(() => {
    extractionRunIdRef.current += 1;
    extractionControllerRef.current?.abort();
    extractionControllerRef.current = null;
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = null;
    releaseFrameUrls();
    setVideoMetadata(null);
    setFrames([]);
    setIsProcessing(false);
    setIsSettingsCollapsed(false);
    setProgress(0);
    setProgressDetails({ current: 0, total: 0, status: "" });
    setPreviewFrame(null);
  }, [releaseFrameUrls]);

  const handleCancelExtraction = useCallback(() => {
    if (extractionControllerRef.current && !extractionControllerRef.current.signal.aborted) {
      setProgressDetails((current) => ({ ...current, status: "Cancelling extraction…" }));
      extractionControllerRef.current.abort();
    }
  }, []);

  const handleStartExtraction = useCallback(async () => {
    if (!videoMetadata || isProcessing) return;
    const controller = new AbortController();
    const runId = ++extractionRunIdRef.current;
    extractionControllerRef.current = controller;
    setIsProcessing(true);
    setProgress(0);
    setProgressDetails({ current: 0, total: 0, status: "Preparing browser video decoder…" });

    try {
      const extractedFrames = await extractFramesViaCanvas(
        videoMetadata,
        settings,
        (p, current, total) => {
          if (runId !== extractionRunIdRef.current || controller.signal.aborted) return;
          setProgress(p);
          setProgressDetails({
            current,
            total,
            status: p < 100 ? "Extracting frames locally…" : "Finalizing image files…",
          });
        },
        controller.signal
      );

      if (runId !== extractionRunIdRef.current || controller.signal.aborted) {
        extractedFrames.forEach((frame) => URL.revokeObjectURL(frame.dataUrl));
        return;
      }
      releaseFrameUrls();
      frameUrlsRef.current = new Set(extractedFrames.map((frame) => frame.dataUrl));
      setFrames(extractedFrames);
      setPreviewFrame(null);
      setIsSettingsCollapsed(true);
      addToast(
        "success",
        "Extraction complete",
        `Extracted ${extractedFrames.length} ${extractedFrames.length === 1 ? "frame" : "frames"}.`,
        videoMetadata.name
      );
      window.requestAnimationFrame(() => {
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        gallerySectionRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    } catch (err: unknown) {
      if (runId !== extractionRunIdRef.current) return;
      const error =
        err instanceof Error
          ? err
          : new Error("An unexpected error occurred during frame extraction.");
      if (controller.signal.aborted || error.name === "AbortError") {
        addToast("info", "Extraction cancelled", "Frame extraction was stopped before completion.");
      } else {
        addToast("error", "Extraction failed", error.message);
      }
    } finally {
      if (runId === extractionRunIdRef.current) {
        extractionControllerRef.current = null;
        setIsProcessing(false);
      }
    }
  }, [addToast, isProcessing, releaseFrameUrls, settings, videoMetadata]);

  const handleCaptureFrame = useCallback(
    async (videoEl: HTMLVideoElement) => {
      if (!videoMetadata || isProcessing || isCapturing) return;

      if (frames.length >= MAX_EXTRACTED_FRAMES) {
        addToast(
          "warning",
          "Frame limit reached",
          `Gallery is capped at ${MAX_EXTRACTED_FRAMES} frames per session.`
        );
        return;
      }

      const timestamp = Number(Math.max(0, videoEl.currentTime).toFixed(4));
      if (hasDuplicateTimestamp(frames, timestamp)) {
        addToast(
          "info",
          "Frame already captured",
          "A frame at this timestamp is already in your gallery."
        );
        return;
      }

      const scaled = calculateScaledDimensions(
        videoMetadata.width,
        videoMetadata.height,
        settings.scale
      );
      const currentBytes = frames.reduce((sum, f) => sum + f.sizeBytes, 0);
      const nextFrameEstimate = estimateOutputBytes(1, scaled.width, scaled.height, settings);
      if (currentBytes + nextFrameEstimate > MAX_ESTIMATED_OUTPUT_BYTES) {
        addToast(
          "warning",
          "Output limit reached",
          "Capturing another frame would exceed the 512 MiB output safety guardrail."
        );
        return;
      }

      setIsCapturing(true);
      try {
        const captured = await captureSingleFrameViaCanvas(
          videoEl,
          videoMetadata,
          settings,
          frames.length + 1
        );
        frameUrlsRef.current.add(captured.dataUrl);
        setFrames((prev) => [...prev, captured]);
        addToast(
          "success",
          "Frame captured",
          `Captured frame at ${captured.formattedTime} (${captured.width}×${captured.height}).`
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Could not capture the current frame.";
        addToast("error", "Capture failed", msg);
      } finally {
        setIsCapturing(false);
      }
    },
    [addToast, frames, isCapturing, isProcessing, settings, videoMetadata]
  );

  const handleToggleSelect = (id: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  };

  const handleSelectRange = (ids: string[], selected: boolean) => {
    const idSet = new Set(ids);
    setFrames((prev) => prev.map((f) => (idSet.has(f.id) ? { ...f, selected } : f)));
  };

  const handleSelectEveryNth = (n: number) => {
    setFrames((prev) => prev.map((f, idx) => ({ ...f, selected: idx % n === 0 })));
  };

  const handleSelectAll = () => {
    setFrames((prev) => prev.map((f) => ({ ...f, selected: true })));
  };

  const handleDeselectAll = () => {
    setFrames((prev) => prev.map((f) => ({ ...f, selected: false })));
  };

  const handleInvertSelection = () => {
    setFrames((prev) => prev.map((f) => ({ ...f, selected: !f.selected })));
  };

  const activePreviewIndex = previewFrame
    ? frames.findIndex((frame) => frame.id === previewFrame.id)
    : -1;
  const activePreviewFrame = activePreviewIndex >= 0 ? frames[activePreviewIndex] : null;

  const handleNavigatePreview = (direction: "prev" | "next") => {
    if (activePreviewIndex < 0) return;
    const nextIndex = direction === "prev" ? activePreviewIndex - 1 : activePreviewIndex + 1;
    if (nextIndex >= 0 && nextIndex < frames.length) {
      setPreviewFrame(frames[nextIndex]);
    }
  };

  return (
    <div
      className="flex flex-col flex-1 w-full"
      style={floatingBarHeight > 0 ? { paddingBottom: `${floatingBarHeight}px` } : undefined}
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} bottomOffset={floatingBarHeight} />
      <Navbar onReset={handleReset} hasVideo={!!videoMetadata} />

      {/* Hero section */}
      <HeroSection />

      {/* Marquee strip */}
      <MarqueeStrip />

      {/* Workspace / Tool section */}
      <main id="tool">
        <section className="w-full py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Section eyebrow */}
            <div className="flex flex-col items-center text-center gap-3 mb-10">
              <p className="text-xs font-display font-700 uppercase tracking-widest text-brand-accent flex items-center gap-2">
                <span className="inline-block w-4 h-px bg-brand-accent" />
                Workspace
                <span className="inline-block w-4 h-px bg-brand-accent" />
              </p>
              <h2 className="font-display font-800 text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.1] tracking-tight text-foreground">
                Extract frames from your video
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed">
                Drop a video, configure the capture settings, and export your frames — all locally.
              </p>
            </div>

            {/* Tool glass container */}
            <div className="glass rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col gap-[var(--fluid-lg-xl)]">
              {videoMetadata && isSettingsCollapsed && !isProcessing ? (
                <section
                  aria-label="Extraction summary"
                  className="w-full border border-brand-border rounded-2xl bg-brand-card px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <FileVideo className="size-5 shrink-0 text-brand-accent mt-0.5 sm:mt-0" />
                    <div className="min-w-0">
                      <Typography as="p" variant="label" weight={600} className="truncate">
                        {videoMetadata.name}
                      </Typography>
                      <Typography as="p" variant="bodySm" muted className="font-mono">
                        {frames.length.toLocaleString()} {frames.length === 1 ? "frame" : "frames"}{" "}
                        &middot;{" "}
                        {settings.format === "image/jpeg"
                          ? "JPEG"
                          : settings.format === "image/png"
                            ? "PNG"
                            : "WebP"}{" "}
                        &middot;{" "}
                        {settings.format === "image/png"
                          ? "Lossless"
                          : `${Math.round(settings.quality * 100)}%`}
                      </Typography>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSettingsCollapsed(false)}
                    className="type-fluid type-button h-9 px-3 rounded-xl border border-brand-border bg-brand-card hover:border-brand-accent/40 text-foreground inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto"
                  >
                    <SlidersHorizontal className="size-4" />
                    <span>Edit settings</span>
                  </button>
                </section>
              ) : (
                <>
                  <VideoUploadZone
                    videoMetadata={videoMetadata}
                    onVideoSelected={handleVideoSelected}
                    onReset={handleReset}
                    onError={(title, msg) => addToast("error", title, msg)}
                    isProcessing={isProcessing}
                    onCaptureFrame={handleCaptureFrame}
                    isCapturing={isCapturing}
                    trimStart={settings.trimStart}
                    trimEnd={settings.trimEnd}
                    onTrimChange={(start, end) =>
                      setSettings((prev) => ({ ...prev, trimStart: start, trimEnd: end }))
                    }
                    onResetTrim={() =>
                      videoMetadata &&
                      setSettings((prev) => ({
                        ...prev,
                        trimStart: 0,
                        trimEnd: videoMetadata.duration,
                      }))
                    }
                    frameTimestamps={
                      videoMetadata ? buildFrameTimestamps(videoMetadata.duration, settings) : []
                    }
                  />

                  {videoMetadata && (
                    <ExtractionControls
                      metadata={videoMetadata}
                      settings={settings}
                      onSettingsChange={setSettings}
                      onStartExtraction={handleStartExtraction}
                      isProcessing={isProcessing}
                    />
                  )}
                </>
              )}

              {isProcessing && (
                <LiquidProgressBar
                  progress={progress}
                  currentFrame={progressDetails.current}
                  totalFrames={progressDetails.total}
                  statusText={progressDetails.status}
                  onCancel={handleCancelExtraction}
                />
              )}

              <div ref={gallerySectionRef}>
                {isProcessing ? (
                  <FrameGallerySkeleton
                    width={videoMetadata?.width}
                    height={videoMetadata?.height}
                  />
                ) : (
                  frames.length > 0 && (
                    <FrameGallery
                      frames={frames}
                      videoName={videoMetadata?.name || "extracted_video"}
                      filenameTemplate={settings.filenameTemplate}
                      onToggleSelect={handleToggleSelect}
                      onSelectRange={handleSelectRange}
                      onSelectEveryNth={handleSelectEveryNth}
                      onSelectAll={handleSelectAll}
                      onDeselectAll={handleDeselectAll}
                      onInvertSelection={handleInvertSelection}
                      onPreviewFrame={setPreviewFrame}
                    />
                  )
                )}
              </div>

              {/* Share / link row */}
              {frames.length === 0 && !isProcessing && (
                <div className="border-t border-brand-border pt-4">
                  <ShareFunctions onNotify={(type, title, msg) => addToast(type, title, msg)} />
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Features section */}
      <FeaturesSection />

      {/* How it works section */}
      <HowItWorksSection />

      {/* FAQ section */}
      <FAQSection />

      <Footer />

      <FloatingActionBar
        frames={frames}
        videoName={videoMetadata?.name || "extracted_frames"}
        filenameTemplate={settings.filenameTemplate}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onError={(title, msg) => addToast("error", title, msg)}
        onSuccess={(title, msg) => addToast("success", title, msg)}
        onHeightChange={setFloatingBarHeight}
      />

      <FramePreviewModal
        frame={activePreviewFrame}
        videoName={videoMetadata?.name || "frame"}
        filenameTemplate={settings.filenameTemplate}
        onClose={() => setPreviewFrame(null)}
        onToggleSelect={handleToggleSelect}
        onNavigate={handleNavigatePreview}
        hasPrev={activePreviewIndex > 0}
        hasNext={activePreviewIndex >= 0 && activePreviewIndex < frames.length - 1}
      />
    </div>
  );
}
