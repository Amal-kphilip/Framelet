"use client";

import React, { useState, useCallback } from "react";
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
import { extractFramesViaCanvas, extractFramesViaFFmpeg } from "@/lib/ffmpeg";
import { Sparkles, Layers, ShieldCheck, Film, Cpu, Zap } from "lucide-react";

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

  // Add a toast notification
  const addToast = useCallback((type: ToastMessage["type"], title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle Video Selection
  const handleVideoSelected = useCallback((metadata: VideoMetadata) => {
    setVideoMetadata(metadata);
    setFrames([]);
    setProgress(0);
    addToast(
      "success",
      "Video Loaded Successfully",
      `Loaded "${metadata.name}" (${metadata.formattedDuration}, ${metadata.width}x${metadata.height})`
    );
  }, [addToast]);

  // Handle Full Reset
  const handleReset = useCallback(() => {
    if (videoMetadata?.url) {
      URL.revokeObjectURL(videoMetadata.url);
    }
    // Revoke frame data URLs
    frames.forEach((f) => URL.revokeObjectURL(f.dataUrl));
    setVideoMetadata(null);
    setFrames([]);
    setIsProcessing(false);
    setProgress(0);
    setPreviewFrame(null);
  }, [videoMetadata, frames]);

  // Start Frame Extraction
  const handleStartExtraction = async () => {
    if (!videoMetadata) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressDetails({ current: 0, total: 0, status: "Starting client-side frame engine..." });

    try {
      // Use client-side extraction with fallback
      const extractedFrames = await extractFramesViaCanvas(
        videoMetadata,
        settings,
        (p, current, total) => {
          setProgress(p);
          setProgressDetails({
            current,
            total,
            status: p < 100 ? "Extracting high-resolution frames..." : "Finalizing frame collection...",
          });
        }
      );

      setFrames(extractedFrames);
      addToast(
        "success",
        "Extraction Complete!",
        `Captured ${extractedFrames.length} pristine frames at ${videoMetadata.width}x${videoMetadata.height} resolution.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred during frame extraction.";
      addToast("error", "Extraction Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 w-full space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
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
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight"
          >
            Extract Frames with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              Zero-Lag Precision
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto"
          >
            Process clips up to 90 seconds directly in your browser. Original resolution, hardware-accelerated, zero server uploads.
          </motion.p>
        </div>

        {/* Upload Zone */}
        <VideoUploadZone
          videoMetadata={videoMetadata}
          onVideoSelected={handleVideoSelected}
          onError={(title, msg) => addToast("error", title, msg)}
          onClear={handleReset}
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
              <h3 className="text-base font-bold text-white mb-2">100% Client-Side Engine</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Videos never leave your machine. Hardware acceleration decodes video frames locally with zero network latency.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Native Resolution</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Preserve exact pixels whether 1080p, 4K, or 8K. Choose between lossless PNG, WebP, or crisp JPEG exports.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Instant ZIP Bundling</h3>
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
        frame={previewFrame}
        videoName={videoMetadata?.name || "frame"}
        onClose={() => setPreviewFrame(null)}
        onToggleSelect={handleToggleSelect}
      />
    </main>
  );
}
