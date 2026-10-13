"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { VideoUploadZone } from "@/components/VideoUploadZone";
import { ExtractionControls } from "@/components/ExtractionControls";
import { LiquidProgressBar } from "@/components/LiquidProgressBar";
import { FrameGallery } from "@/components/FrameGallery";
import { FloatingActionBar } from "@/components/FloatingActionBar";
import { FramePreviewModal } from "@/components/FramePreviewModal";
import { ToastContainer } from "@/components/Toast";
import { ExtractedFrame, ExtractionSettings, ToastMessage, VideoMetadata } from "@/types";
import { extractFramesViaCanvas } from "@/lib/canvasExtractor";
import { Sparkles, Layers, ShieldCheck, Cpu } from "lucide-react";

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

  useEffect(() => () => {
    extractionRunIdRef.current += 1;
    extractionControllerRef.current?.abort();
    extractionControllerRef.current = null;
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    videoUrlRef.current = null;
    frameUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    frameUrlsRef.current.clear();
  }, []);

  // Add a toast notification
  const addToast = useCallback((type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Replace the active session and release assets owned by the previous session.
  const handleVideoSelected = useCallback((metadata: VideoMetadata) => {
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
      "Video Loaded",
      `Loaded "${metadata.name}" (${metadata.formattedDuration}, ${metadata.width}×${metadata.height}).`
    );
  }, [addToast, releaseFrameUrls]);

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

  // Start Frame Extraction with cancellation and stale-result protection.
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
        "Extraction Complete",
        `Captured ${extractedFrames.length} frames at ${videoMetadata.width}×${videoMetadata.height}.`
      );
    } catch (err: unknown) {
      if (runId !== extractionRunIdRef.current) return;
      const error = err instanceof Error ? err : new Error("An unexpected error occurred during frame extraction.");
      if (controller.signal.aborted || error.name === "AbortError") {
        addToast("info", "Extraction Cancelled", "The current extraction was stopped. Your previous frames, if any, are unchanged.");
      } else {
        addToast("error", "Extraction Failed", error.message);
      }
    } finally {
      if (runId === extractionRunIdRef.current) {
        extractionControllerRef.current = null;
        setIsProcessing(false);
      }
    }
  }, [addToast, isProcessing, releaseFrameUrls, settings, videoMetadata]);

  // Frame Selection Handlers
  const handleToggleSelect = (id: string) => {
    setFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
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
    <main className="min-h-screen flex flex-col relative pb-32">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Header onReset={handleReset} hasVideo={!!videoMetadata} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-9 w-full space-y-8">
        {/* Hero Section */}
        <div className={`text-center max-w-3xl mx-auto ${videoMetadata ? "space-y-2" : "space-y-4"}`} aria-live="polite">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-xl text-xs font-medium text-sky-300 shadow-glass"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Next-Gen Liquid Glass Video Extraction</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${videoMetadata ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl md:text-6xl"} font-extrabold tracking-tight text-white leading-tight`}
          >
            {videoMetadata ? "Video Ready for Extraction" : "Extract Frames with"}{" "}
            {!videoMetadata && <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              Precision and Control
            </span>}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto"
          >
            Process clips up to 90 seconds in your browser. Video files are not uploaded; codec support depends on your browser.
          </motion.p>
        </div>

        {/* Upload Zone */}
        <VideoUploadZone
          videoMetadata={videoMetadata}
          onVideoSelected={handleVideoSelected}
          onError={(title, msg) => addToast("error", title, msg)}
          isProcessing={isProcessing}
        />

        {/* Controls Section (Appears after video loaded) */}
        <AnimatePresence>
          {videoMetadata && (
            <ExtractionControls
              metadata={videoMetadata}
              settings={settings}
              onSettingsChange={setSettings}
              onStartExtraction={handleStartExtraction}
              isProcessing={isProcessing}
            />
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <AnimatePresence>
          {isProcessing && (
            <LiquidProgressBar
              progress={progress}
              currentFrame={progressDetails.current}
              totalFrames={progressDetails.total}
              statusText={progressDetails.status}
              onCancel={handleCancelExtraction}
            />
          )}
        </AnimatePresence>

        {/* Frames Gallery */}
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

        {/* Feature Highlights (when empty) */}
        {!videoMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6"
          >
            <div className="p-6 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Private, In-Browser Processing</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Video content stays on your device. Frames are decoded locally using your browser’s supported video codecs.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Native Resolution</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Keep the source video dimensions for each frame. Export as PNG, JPEG, or WebP where supported by your browser.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Selective ZIP Export</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Multi-select desired frames and package them instantly into structured ZIP archives with metadata manifest.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar
        frames={frames}
        videoName={videoMetadata?.name || "extracted_frames"}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onError={(title, msg) => addToast("error", title, msg)}
        onSuccess={(title, msg) => addToast("success", title, msg)}
      />

      {/* Frame Preview Modal */}
      <FramePreviewModal
        frame={previewFrame ? frames.find((frame) => frame.id === previewFrame.id) ?? null : null}
        videoName={videoMetadata?.name || "frame"}
        onClose={() => setPreviewFrame(null)}
        onToggleSelect={handleToggleSelect}
      />
    </main>
  );
}
