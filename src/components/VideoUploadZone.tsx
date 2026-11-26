"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, FileVideo, Loader2, X, Camera, RotateCcw, Upload } from "lucide-react";
import { VideoMetadata } from "@/types";
import {
  formatBytes,
  formatDuration,
  loadVideoMetadata,
  MAX_ALLOWED_DURATION_SECONDS,
} from "@/lib/videoUtils";

interface VideoUploadZoneProps {
  videoMetadata: VideoMetadata | null;
  onVideoSelected: (metadata: VideoMetadata) => void;
  onReset?: () => void;
  onError: (title: string, message: string) => void;
  isProcessing: boolean;
  onCaptureFrame?: (videoEl: HTMLVideoElement) => void;
  isCapturing?: boolean;
  trimStart?: number;
  trimEnd?: number;
  onTrimChange?: (start: number, end: number) => void;
  onResetTrim?: () => void;
  frameTimestamps?: number[];
}

const ACCEPTED_EXTENSIONS_LABEL = `MP4 · WEBM · MOV · MKV · AVI · UP TO ${MAX_ALLOWED_DURATION_SECONDS}S`;

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  videoMetadata,
  onVideoSelected,
  onReset,
  onError,
  isProcessing,
  onCaptureFrame,
  isCapturing = false,
  trimStart = 0,
  trimEnd,
  onTrimChange,
  onResetTrim,
  frameTimestamps = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trimTrackRef = useRef<HTMLDivElement | null>(null);
  const draggingHandleRef = useRef<"start" | "end" | null>(null);
  const fileRequestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      fileRequestIdRef.current += 1;
    };
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const requestId = ++fileRequestIdRef.current;
      setIsLoadingFile(true);
      try {
        const metadata = await loadVideoMetadata(file);
        if (requestId !== fileRequestIdRef.current) {
          URL.revokeObjectURL(metadata.url);
          return;
        }
        onVideoSelected(metadata);
      } catch (err: unknown) {
        if (requestId !== fileRequestIdRef.current) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to process video";
        onError("Video Validation Error", errorMessage);
      } finally {
        if (requestId === fileRequestIdRef.current) setIsLoadingFile(false);
      }
    },
    [onError, onVideoSelected]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing && !isLoadingFile && !isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (
      e.dataTransfer.files &&
      e.dataTransfer.files.length > 0 &&
      !isProcessing &&
      !isLoadingFile
    ) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    e.currentTarget.value = "";
  };

  const openFilePicker = () => {
    if (!isLoadingFile && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleDropzoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if ((event.key === "Enter" || event.key === " ") && !isLoadingFile && !isProcessing) {
      event.preventDefault();
      openFilePicker();
    }
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        setIsPlaying(false);
        onError(
          "Playback Unavailable",
          "Your browser could not start playback for this video. You may still be able to extract frames if its decoder is available."
        );
      }
    } else {
      video.pause();
    }
  };

  const seekPreview = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(event.currentTarget.value);
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setPreviewTime(nextTime);
  };

  const formatPreviewTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  const duration = videoMetadata?.duration ?? 0;
  const effectiveTrimStart = Math.max(0, Math.min(duration, trimStart));
  const effectiveTrimEnd = Math.max(effectiveTrimStart, Math.min(duration, trimEnd ?? duration));
  const minGap = Math.min(0.25, duration * 0.05);
  const isTrimmed =
    duration > 0 && (effectiveTrimStart > 0.01 || effectiveTrimEnd < duration - 0.01);
  const seekPercent = duration > 0 ? Math.min(100, (previewTime / duration) * 100) : 0;

  const clampTrimRange = (nextStart: number, nextEnd: number): [number, number] => {
    const s = Math.max(0, Math.min(duration - minGap, nextStart));
    const e = Math.min(duration, Math.max(s + minGap, nextEnd));
    return [Number(s.toFixed(2)), Number(e.toFixed(2))];
  };

  const updateTrimFromPointer = (clientX: number, handle: "start" | "end") => {
    if (!trimTrackRef.current || !onTrimChange || duration <= 0) return;
    const rect = trimTrackRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = ratio * duration;
    if (handle === "start") {
      const [s, e] = clampTrimRange(
        Math.min(targetTime, effectiveTrimEnd - minGap),
        effectiveTrimEnd
      );
      onTrimChange(s, e);
    } else {
      const [s, e] = clampTrimRange(
        effectiveTrimStart,
        Math.max(targetTime, effectiveTrimStart + minGap)
      );
      onTrimChange(s, e);
    }
  };

  const handleTrimKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, handle: "start" | "end") => {
    if (!onTrimChange || isProcessing || duration <= 0) return;
    const step = e.shiftKey ? 1.0 : 0.1;
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -step;
    else if (e.key === "Home") delta = -duration;
    else if (e.key === "End") delta = duration;
    else return;

    e.preventDefault();
    if (handle === "start") {
      const nextStart = Math.max(
        0,
        Math.min(effectiveTrimEnd - minGap, effectiveTrimStart + delta)
      );
      onTrimChange(Number(nextStart.toFixed(2)), effectiveTrimEnd);
    } else {
      const nextEnd = Math.min(
        duration,
        Math.max(effectiveTrimStart + minGap, effectiveTrimEnd + delta)
      );
      onTrimChange(effectiveTrimStart, Number(nextEnd.toFixed(2)));
    }
  };

  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      (e.key === "c" || e.key === "C") &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      onCaptureFrame &&
      videoRef.current &&
      !isProcessing &&
      !isCapturing
    ) {
      e.preventDefault();
      onCaptureFrame(videoRef.current);
    }
  };

  const useDensityShading = frameTimestamps.length > 120;

  return (
    <div className="w-full flex flex-col gap-2.5">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,.mp4,.webm,.mov,.mkv,.avi"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="hidden"
      />

      <span className="hidden sm:inline text-xs font-mono tracking-wider text-muted-foreground">
        {ACCEPTED_EXTENSIONS_LABEL}
      </span>

      {!videoMetadata ? (
        <div
          role="button"
          tabIndex={isLoadingFile || isProcessing ? -1 : 0}
          aria-disabled={isLoadingFile || isProcessing}
          aria-label="Add video file: drag and drop, or activate to browse"
          onClick={openFilePicker}
          onKeyDown={handleDropzoneKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`glass relative flex flex-col items-center justify-center w-full min-h-64 sm:min-h-80 md:min-h-96 p-6 sm:p-12 gap-5 rounded-3xl border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? "border-brand-accent bg-brand-accent/15 shadow-accent-strong scale-[1.005]"
              : "border-brand-borderHover hover:border-brand-accent/50"
          } ${isLoadingFile || isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex flex-col items-center gap-4 text-foreground">
            {isLoadingFile ? (
              <div className="flex items-center gap-2.5">
                <Loader2 className="size-6 animate-spin text-brand-accent" />
                <p className="text-sm font-medium">Reading video file...</p>
              </div>
            ) : (
              <>
                <div className="animate-float size-14 rounded-2xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accentText shadow-accent">
                  <Upload className="size-6" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center text-center gap-1">
                  <p className="font-display font-700 text-base sm:text-lg text-foreground">
                    Drag &amp; drop a video here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or{" "}
                    <span className="font-semibold text-brand-accentText hover:underline">
                      click to browse
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>

          <p className="absolute right-5 sm:right-8 bottom-4 text-xs font-medium text-muted-foreground">
            {`Max ${MAX_ALLOWED_DURATION_SECONDS}s · Local processing`}
          </p>
        </div>
      ) : (
        <div className="glass w-full border border-brand-border rounded-3xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-hidden">
          {/* File header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-brand-border">
            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
              <div className="size-9 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accentText shrink-0">
                <FileVideo className="size-4" strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-sm font-semibold text-foreground truncate"
                  title={videoMetadata.name}
                >
                  {videoMetadata.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono leading-snug mt-0.5">
                  {`${videoMetadata.width} × ${videoMetadata.height} (${videoMetadata.aspectRatio}) · ${videoMetadata.formattedDuration} · ${formatBytes(videoMetadata.size)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                disabled={isProcessing}
                onClick={openFilePicker}
                className="h-9 px-3.5 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Replace
              </button>
              {onReset && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onReset}
                  aria-label={`Remove ${videoMetadata.name}`}
                  className="size-9 shrink-0 inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-foreground transition-colors disabled:opacity-50"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Crisp video preview monitor */}
          <div
            className="flex flex-col gap-3 w-full outline-none"
            tabIndex={0}
            aria-label="Video player controls. Press C to capture current frame."
            onKeyDown={handlePlayerKeyDown}
          >
            <div className="relative w-full aspect-video max-h-[50vh] bg-black border border-brand-border rounded-2xl overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoMetadata.url}
                className="w-full h-full object-contain"
                onLoadedMetadata={() => setPreviewTime(0)}
                onTimeUpdate={() => setPreviewTime(videoRef.current?.currentTime ?? 0)}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              />
            </div>

            {/* Playback & scrub controls with tick marks */}
            <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video preview" : "Play video preview"}
                className="size-9 shrink-0 inline-flex items-center justify-center rounded-xl border border-brand-border bg-brand-card/80 hover:border-brand-accent/40 text-foreground transition-colors"
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>

              <div className="relative flex-1 min-w-0 flex flex-col justify-center">
                <input
                  type="range"
                  min={0}
                  max={Math.max(videoMetadata.duration, 0.01)}
                  step={0.05}
                  value={Math.min(previewTime, videoMetadata.duration)}
                  onChange={seekPreview}
                  aria-label="Seek video preview"
                  aria-valuetext={`${formatPreviewTime(previewTime)} of ${videoMetadata.formattedDuration}`}
                  style={{
                    background: `linear-gradient(to right, var(--slider-accent) 0%, var(--slider-accent) ${seekPercent}%, var(--slider-track) ${seekPercent}%, var(--slider-track) 100%)`,
                  }}
                  className="accent-slider w-full relative z-10"
                />

                {/* Display-only scrubber tick marks from buildFrameTimestamps */}
                {duration > 0 && frameTimestamps.length > 0 && (
                  <div
                    aria-hidden="true"
                    className="relative w-full h-2 mt-1 pointer-events-none overflow-hidden rounded-full"
                  >
                    {useDensityShading ? (
                      <div
                        className="absolute inset-y-0 rounded-full bg-brand-accent/35"
                        style={{
                          left: `${(effectiveTrimStart / duration) * 100}%`,
                          width: `${((effectiveTrimEnd - effectiveTrimStart) / duration) * 100}%`,
                        }}
                      />
                    ) : (
                      frameTimestamps.map((t, idx) => (
                        <span
                          key={idx}
                          className="absolute top-0 bottom-0 w-px bg-brand-accent/65"
                          style={{ left: `${Math.min(100, (t / duration) * 100)}%` }}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>

              <span className="text-xs font-mono font-semibold text-foreground shrink-0 tabular-nums whitespace-nowrap">
                {formatPreviewTime(previewTime)}/{videoMetadata.formattedDuration}
              </span>

              {onCaptureFrame && (
                <button
                  type="button"
                  disabled={isProcessing || isCapturing}
                  onClick={() => videoRef.current && onCaptureFrame(videoRef.current)}
                  title="Capture current frame (C)"
                  aria-label="Capture current frame (shortcut C)"
                  className="h-9 px-2.5 sm:px-3.5 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-border bg-brand-card/80 hover:border-brand-accent/50 hover:text-brand-accentText text-foreground text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {isCapturing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Camera className="size-4" />
                  )}
                  <span className="hidden sm:inline">Capture frame</span>
                </button>
              )}
            </div>

            {/* Trim Range Handles */}
            {onTrimChange && duration > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    Range: {formatDuration(effectiveTrimStart)} – {formatDuration(effectiveTrimEnd)}
                  </span>
                  {onResetTrim && isTrimmed && (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={onResetTrim}
                      className="text-xs font-semibold text-brand-accentText hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="size-3" />
                      <span>Reset range</span>
                    </button>
                  )}
                </div>

                <div
                  ref={trimTrackRef}
                  className="relative h-6 flex items-center select-none touch-none"
                  onPointerMove={(e) => {
                    if (draggingHandleRef.current) {
                      updateTrimFromPointer(e.clientX, draggingHandleRef.current);
                    }
                  }}
                  onPointerUp={() => {
                    draggingHandleRef.current = null;
                  }}
                  onPointerCancel={() => {
                    draggingHandleRef.current = null;
                  }}
                >
                  <div className="w-full h-2 rounded-full border border-brand-border bg-secondary relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 bg-brand-accent/45"
                      style={{
                        left: `${(effectiveTrimStart / duration) * 100}%`,
                        width: `${((effectiveTrimEnd - effectiveTrimStart) / duration) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Start Handle */}
                  <div
                    role="slider"
                    tabIndex={isProcessing ? -1 : 0}
                    aria-label="Trim start time"
                    aria-valuemin={0}
                    aria-valuemax={Number((effectiveTrimEnd - minGap).toFixed(2))}
                    aria-valuenow={Number(effectiveTrimStart.toFixed(2))}
                    aria-valuetext={formatDuration(effectiveTrimStart)}
                    onKeyDown={(e) => handleTrimKeyDown(e, "start")}
                    onPointerDown={(e) => {
                      if (isProcessing) return;
                      draggingHandleRef.current = "start";
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateTrimFromPointer(e.clientX, "start");
                    }}
                    style={{ left: `${(effectiveTrimStart / duration) * 100}%` }}
                    className="absolute -translate-x-1/2 size-4 rounded-full border-2 border-brand-accent bg-background hover:scale-110 cursor-ew-resize shadow-accent transition-transform"
                  />

                  {/* End Handle */}
                  <div
                    role="slider"
                    tabIndex={isProcessing ? -1 : 0}
                    aria-label="Trim end time"
                    aria-valuemin={Number((effectiveTrimStart + minGap).toFixed(2))}
                    aria-valuemax={Number(duration.toFixed(2))}
                    aria-valuenow={Number(effectiveTrimEnd.toFixed(2))}
                    aria-valuetext={formatDuration(effectiveTrimEnd)}
                    onKeyDown={(e) => handleTrimKeyDown(e, "end")}
                    onPointerDown={(e) => {
                      if (isProcessing) return;
                      draggingHandleRef.current = "end";
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateTrimFromPointer(e.clientX, "end");
                    }}
                    style={{ left: `${(effectiveTrimEnd / duration) * 100}%` }}
                    className="absolute -translate-x-1/2 size-4 rounded-full border-2 border-white bg-brand-accent hover:scale-110 cursor-ew-resize shadow-accent transition-transform"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
