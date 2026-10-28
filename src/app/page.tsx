"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { VideoUploadZone } from "@/components/VideoUploadZone";
import { ExtractionControls } from "@/components/ExtractionControls";
import { LiquidProgressBar } from "@/components/LiquidProgressBar";
import { FrameGallery } from "@/components/FrameGallery";
import { FloatingActionBar } from "@/components/FloatingActionBar";
import { FramePreviewModal } from "@/components/FramePreviewModal";
import { ToastContainer } from "@/components/Toast";
import { ShareFunctions } from "@/components/ShareFunctions";
import { Footer, SideNav } from "@/components/Footer";
import Typography from "@/components/Typography";
import { ExtractedFrame, ExtractionSettings, ToastMessage, VideoMetadata } from "@/types";
import { extractFramesViaCanvas } from "@/lib/canvasExtractor";

export default function Home() {
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [settings, setSettings] = useState<ExtractionSettings>({
    mode: "interval",
    fps: 1,
    interval: 1.0,
    format: "image/jpeg",
    quality: 0.95,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetails, setProgressDetails] = useState({ current: 0, total: 0, status: "" });
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [previewFrame, setPreviewFrame] = useState<ExtractedFrame | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const extractionControllerRef = useRef<AbortController | null>(null);
  const extractionRunIdRef = useRef(0);
  const videoUrlRef = useRef<string | null>(null);
  const frameUrlsRef = useRef<Set<string>>(new Set());

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

  const addToast = useCallback((type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

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
      setFrames([]);
      setPreviewFrame(null);
      setIsProcessing(false);
      setProgress(0);
      setProgressDetails({ current: 0, total: 0, status: "" });
      addToast(
        "success",
        "Video queued",
        `Loaded "${metadata.name}" (${metadata.formattedDuration}, ${metadata.width}×${metadata.height}).`
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
      addToast(
        "success",
        "Extraction complete",
        `Captured ${extractedFrames.length} frames at ${videoMetadata.width}×${videoMetadata.height}.`
      );
    } catch (err: unknown) {
      if (runId !== extractionRunIdRef.current) return;
      const error = err instanceof Error ? err : new Error("An unexpected error occurred during frame extraction.");
      if (controller.signal.aborted || error.name === "AbortError") {
        addToast("info", "Extraction cancelled", "The current extraction was stopped.");
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

  const handleToggleSelect = (id: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
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

  return (
    <div className="flex flex-col flex-1 w-full">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Header onReset={handleReset} hasVideo={!!videoMetadata} />

      <main className="flex-1 w-full flex flex-col gap-[var(--fluid-xl-3xl)] py-[var(--fluid-md-2xl)]">
        {/* Hero Statement */}
        <section className="w-full">
          <Typography variant="hero" as="h1">
            This app extracts crisp still frames from videos directly in your browser, so your files stay on your device and never get uploaded.
          </Typography>
        </section>

        {/* Dropzone + Workspace */}
        <div className="w-full flex flex-col gap-[var(--fluid-lg-xl)]">
          <VideoUploadZone
            videoMetadata={videoMetadata}
            onVideoSelected={handleVideoSelected}
            onReset={handleReset}
            onError={(title, msg) => addToast("error", title, msg)}
            isProcessing={isProcessing}
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

          {isProcessing && (
            <LiquidProgressBar
              progress={progress}
              currentFrame={progressDetails.current}
              totalFrames={progressDetails.total}
              statusText={progressDetails.status}
              onCancel={handleCancelExtraction}
            />
          )}

          {frames.length > 0 && (
            <FrameGallery
              frames={frames}
              videoName={videoMetadata?.name || "extracted_video"}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onInvertSelection={handleInvertSelection}
              onPreviewFrame={setPreviewFrame}
            />
          )}
        </div>

        <div className="h-[3px] w-full bg-foreground" />

        <ShareFunctions onNotify={(type, title, msg) => addToast(type, title, msg)} />
      </main>

      <Footer />
      <SideNav />

      <FloatingActionBar
        frames={frames}
        videoName={videoMetadata?.name || "extracted_frames"}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onError={(title, msg) => addToast("error", title, msg)}
        onSuccess={(title, msg) => addToast("success", title, msg)}
      />

      <FramePreviewModal
        frame={previewFrame ? frames.find((frame) => frame.id === previewFrame.id) ?? null : null}
        videoName={videoMetadata?.name || "frame"}
        onClose={() => setPreviewFrame(null)}
        onToggleSelect={handleToggleSelect}
      />
    </div>
  );
}
