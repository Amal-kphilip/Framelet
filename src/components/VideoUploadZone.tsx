"use client";

import React, { useState, useRef, useCallback } from "react";
import { UploadCloud, Film, Play, Pause, AlertCircle, Clock, Maximize2, FileVideo, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VideoMetadata } from "@/types";
import { formatBytes, formatDurationSimple, loadVideoMetadata, MAX_ALLOWED_DURATION_SECONDS } from "@/lib/videoUtils";

interface VideoUploadZoneProps {
  videoMetadata: VideoMetadata | null;
  onVideoSelected: (metadata: VideoMetadata) => void;
  onError: (title: string, message: string) => void;
  onClear: () => void;
  isProcessing: boolean;
}

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  videoMetadata,
  onVideoSelected,
  onError,
  onClear,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processFile = useCallback(async (file: File) => {
    setIsLoadingFile(true);
    try {
      const metadata = await loadVideoMetadata(file);
      onVideoSelected(metadata);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process video";
      onError("Video Validation Error", errorMessage);
    } finally {
      setIsLoadingFile(false);
    }
  }, [onError, onVideoSelected]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
        onChange={handleFileInput}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {!videoMetadata ? (
          <motion.div
            key="upload-dropzone"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative group cursor-pointer rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 glass-panel border overflow-hidden ${
              isDragging
                ? "border-sky-400 bg-sky-500/[0.08] shadow-[0_0_40px_rgba(56,189,248,0.25)] scale-[1.01]"
                : "border-white/10 hover:border-white/25 hover:bg-white/[0.06] shadow-glass"
            }`}
          >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <div className="flex flex-col items-center justify-center relative z-10 max-w-lg mx-auto">
              {/* Icon Container with Glass Ring */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/15 to-purple-500/20 border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:border-white/40 transition-all duration-300">
                  <UploadCloud className="w-10 h-10 text-sky-400 group-hover:text-sky-300 transition-colors" />
                </div>
                {isLoadingFile && (
                  <div className="absolute inset-0 rounded-3xl border-2 border-sky-400 border-t-transparent animate-spin" />
                )}
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">
                {isLoadingFile ? "Analyzing video file..." : "Drop your video here"}
              </h3>
              <p className="text-sm text-white/60 mb-6 leading-relaxed">
                Supports <span className="text-white/90 font-medium">MP4</span>, <span className="text-white/90 font-medium">WebM</span>, or <span className="text-white/90 font-medium">MOV</span> up to <span className="text-sky-400 font-semibold">{MAX_ALLOWED_DURATION_SECONDS} seconds</span>. Everything processed 100% locally in your browser.
              </p>

              {/* Browse Button */}
              <button
                type="button"
                className="px-6 py-3 rounded-full text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 shadow-glass transition-all duration-200 flex items-center gap-2 group-hover:scale-105 active:scale-95"
              >
                <FileVideo className="w-4 h-4 text-sky-400" />
                <span>Browse Video</span>
              </button>

              {/* Feature Pills */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50">
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> High-Resolution Output
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> Zero Upload Wait
                </span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Original Quality
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="video-preview-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="rounded-3xl p-6 glass-panel border border-white/15 shadow-apple-card relative overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Sleek Integrated Video Player */}
              <div className="lg:col-span-7 relative group rounded-2xl overflow-hidden bg-black/60 border border-white/10 aspect-video flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  src={videoMetadata.url}
                  className="w-full h-full object-contain"
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playsInline
                />

                {/* Custom Glass Player Overlay */}
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl group-hover:bg-white/30 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-white text-white" />
                    ) : (
                      <Play className="w-6 h-6 fill-white text-white ml-1" />
                    )}
                  </motion.button>
                </div>

                {/* Video Duration Badge */}
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-xs font-mono text-white/90 border border-white/10 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {videoMetadata.formattedDuration}
                </div>
              </div>

              {/* Video Info and Details */}
              <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                      Active Video Source
                    </span>
                    {!isProcessing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-white/60 hover:text-white underline underline-offset-4 transition-colors"
                      >
                        Change Video
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white truncate max-w-full" title={videoMetadata.name}>
                    {videoMetadata.name}
                  </h3>
                </div>

                {/* Metadata Badges Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                    <span className="text-[11px] text-white/50 block mb-0.5">Resolution</span>
                    <span className="text-sm font-semibold text-white/90 font-mono">
                      {videoMetadata.width} × {videoMetadata.height}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                    <span className="text-[11px] text-white/50 block mb-0.5">Duration</span>
                    <span className="text-sm font-semibold text-white/90 font-mono">
                      {videoMetadata.formattedDuration} <span className="text-xs text-white/40">({Math.round(videoMetadata.duration * 10) / 10}s)</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                    <span className="text-[11px] text-white/50 block mb-0.5">Aspect Ratio</span>
                    <span className="text-sm font-semibold text-white/90">
                      {videoMetadata.aspectRatio}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm">
                    <span className="text-[11px] text-white/50 block mb-0.5">File Size</span>
                    <span className="text-sm font-semibold text-white/90 font-mono">
                      {formatBytes(videoMetadata.size)}
                    </span>
                  </div>
                </div>

                {/* Status Notice */}
                <div className="p-3 rounded-2xl bg-sky-500/[0.08] border border-sky-500/20 text-xs text-sky-200/90 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                  <span>
                    Validation passed. Ready to extract frames at native {videoMetadata.width}x{videoMetadata.height} resolution.
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
