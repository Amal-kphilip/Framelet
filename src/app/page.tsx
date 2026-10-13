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
import { Sparkles, Layers, ShieldCheck, Cpu, Film, ArrowUpRight, ScanLine, Images } from "lucide-react";

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
    <main className="framelet-page min-h-screen flex flex-col relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="framelet-shell relative w-full">
        <Header onReset={handleReset} hasVideo={!!videoMetadata} />

        <div className="framelet-content w-full">
          {/* Editorial hero: inspired by the reference, adapted to Framelet's workflow. */}
          <section id="home" className={`framelet-hero ${videoMetadata ? "framelet-hero-ready" : ""}`} aria-live="polite">
            <div className="framelet-hero-copy">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="framelet-eyebrow"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>PRIVATE VIDEO WORKSPACE</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="framelet-hero-title"
              >
                {videoMetadata ? <>Your next <span>great frame.</span></> : <>Every frame, <span>in focus.</span></>}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="framelet-hero-lede"
              >
                Turn the moments inside your video into crisp stills. Capture on your terms, preview every frame, and export what matters — right in your browser.
              </motion.p>

              <motion.a
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.55 }}
                href="#extractor"
                className="framelet-primary-link"
              >
                {videoMetadata ? "Continue to workspace" : "Start extracting"}
                <span className="framelet-link-icon"><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></span>
              </motion.a>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, x: 18 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="framelet-hero-art"
              aria-hidden="true"
            >
              <div className="framelet-art-glow" />
              <div className="framelet-art-ring framelet-art-ring-outer" />
              <div className="framelet-art-ring framelet-art-ring-inner" />
              <div className="framelet-film-card framelet-film-card-back"><span>FRAME 024</span><i /><i /><i /></div>
              <div className="framelet-film-card framelet-film-card-front">
                <div className="framelet-viewfinder-corner corner-tl" />
                <div className="framelet-viewfinder-corner corner-tr" />
                <div className="framelet-viewfinder-corner corner-bl" />
                <div className="framelet-viewfinder-corner corner-br" />
                <Film className="framelet-art-film" strokeWidth={1.25} />
                <span className="framelet-art-timecode">00:00:12:08</span>
                <div className="framelet-art-timeline"><i /><i /><i /><i /><i /><i /><i /><i /></div>
              </div>
              <div className="framelet-art-stamp"><ScanLine className="h-3.5 w-3.5" /> FRAME BY FRAME</div>
            </motion.div>

            <div className="framelet-hero-indexes">
              <div><span>01 /</span><strong>Precise capture</strong></div>
              <div><span>02 /</span><strong>Original dimensions</strong></div>
              <div><span>03 /</span><strong>Local by design</strong></div>
              <div className="framelet-hero-index-note">MADE FOR THE DETAILS <span>↗</span></div>
            </div>
          </section>

          <div id="why-framelet" className="framelet-proof-strip" aria-label="Framelet benefits">
            <span className="framelet-proof-heading">A SMALL TOOL FOR BIG DETAILS</span>
            <span><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Files stay on your device</span>
            <span><Film className="h-4 w-4" aria-hidden="true" /> Fine-grained frame control</span>
            <span><Images className="h-4 w-4" aria-hidden="true" /> JPEG · PNG · WebP</span>
          </div>

          <div className="framelet-workspace" id="extractor">
            <div className="framelet-section-intro">
              <div>
                <span className="framelet-section-kicker">THE WORKSPACE / 01</span>
                <h2>Make every second <span>count.</span></h2>
              </div>
              <p>Drop in a clip, choose your capture rhythm, then select the exact stills you want to keep. Nothing gets uploaded.</p>
            </div>

            {/* Upload Zone */}
            <div className="framelet-upload-wrap">
              <VideoUploadZone
                videoMetadata={videoMetadata}
                onVideoSelected={handleVideoSelected}
                onError={(title, msg) => addToast("error", title, msg)}
                isProcessing={isProcessing}
              />
            </div>

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
          </div>

          {/* Feature Highlights (when empty) */}
          {!videoMetadata && (
            <motion.section
              id="features"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="framelet-feature-section"
              aria-labelledby="features-heading"
            >
              <div className="framelet-section-intro framelet-features-intro">
                <div>
                  <span className="framelet-section-kicker">THOUGHTFULLY BUILT / 02</span>
                  <h2 id="features-heading">Less friction. <span>More feeling.</span></h2>
                </div>
                <p>All the essentials for finding the right still — with no account, no upload queue, and no complicated workflow.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }} className="framelet-feature-card">
                  <div className="framelet-feature-icon"><Cpu className="w-5 h-5" aria-hidden="true" /></div>
                  <span className="framelet-feature-number">01 — PRIVATE</span>
                  <h3>Local by default.</h3>
                  <p>Video content stays on your device. Frames are decoded locally using your browser’s supported video codecs.</p>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }} className="framelet-feature-card">
                  <div className="framelet-feature-icon"><Layers className="w-5 h-5" aria-hidden="true" /></div>
                  <span className="framelet-feature-number">02 — PRECISE</span>
                  <h3>Keep the detail.</h3>
                  <p>Retain the source video dimensions for every frame. Export as PNG, JPEG, or WebP where your browser supports it.</p>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }} className="framelet-feature-card">
                  <div className="framelet-feature-icon"><ShieldCheck className="w-5 h-5" aria-hidden="true" /></div>
                  <span className="framelet-feature-number">03 — YOUR PICK</span>
                  <h3>Only what you need.</h3>
                  <p>Select the stills you want and package them into a ZIP archive with a helpful metadata manifest.</p>
                </motion.div>
              </div>
            </motion.section>
          )}
        </div>

        <footer className="framelet-footer">
          <a href="#home" className="framelet-footer-brand" aria-label="Framelet — back to top">FRAMELET<span>®</span></a>
          <p>Find the frame you came for.</p>
          <a href="#extractor" className="framelet-footer-link">BACK TO WORKSPACE <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
        </footer>

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
      </div>
    </main>
  );
}
