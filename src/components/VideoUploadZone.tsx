"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, FileVideo, Loader2, X, Camera, RotateCcw } from "lucide-react";
import { VideoMetadata } from "@/types";
import {
  formatBytes,
  formatDuration,
  loadVideoMetadata,
  MAX_ALLOWED_DURATION_SECONDS,
} from "@/lib/videoUtils";
import Typography from "./Typography";

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

  return (
    <div className="w-full flex flex-col gap-[var(--space-md)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,.mp4,.webm,.mov,.mkv,.avi"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="hidden"
      />

      <Typography variant="legal" muted className="hidden sm:inline">
        {ACCEPTED_EXTENSIONS_LABEL}
      </Typography>

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
          className={`relative flex flex-col items-center justify-center w-full min-h-64 sm:min-h-80 md:min-h-96 p-6 sm:p-[var(--space-3xl)] gap-[var(--space-lg)] border-3 border-dashed rounded-corner transition-colors ${
            isDragging
              ? "border-[var(--accent-primary)] bg-[var(--accent-secondary)]"
              : "border-foreground"
          } ${isLoadingFile || isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex flex-col items-center gap-4 text-foreground">
            {isLoadingFile ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <Typography as="p" variant="label">
                  Reading video file...
                </Typography>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center leading-tight">
                <Typography as="p" variant="label" className="leading-tight">
                  Drag & drop video
                </Typography>
                <Typography as="p" variant="label" className="leading-tight">
                  or{" "}
                  <Typography
                    as="span"
                    variant="label"
                    weight={600}
                    className="hover:underline text-[var(--accent-primary)]"
                  >
                    click to add
                  </Typography>
                </Typography>
              </div>
            )}
          </div>

          <Typography
            as="p"
            variant="bodySm"
            weight={500}
            muted
            className="absolute right-4 sm:right-[var(--space-xl)] bottom-3 sm:bottom-[var(--space-md)]"
          >
            {`Max ${MAX_ALLOWED_DURATION_SECONDS}s · Local processing`}
          </Typography>
        </div>
      ) : (
        <div className="w-full border-2 border-foreground rounded-corner bg-background p-4 sm:p-[var(--space-xl)] flex flex-col gap-4 sm:gap-[var(--space-lg)] overflow-hidden">
          {/* File header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-[var(--space-md)] border-b-2 border-border">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
              <FileVideo
                className="shrink-0 size-5 text-foreground mt-0.5 sm:mt-0"
                strokeWidth={2}
              />
              <div className="min-w-0 flex-1">
                <Typography
                  as="h3"
                  variant="label"
                  weight={600}
                  className="truncate"
                  title={videoMetadata.name}
                >
                  {videoMetadata.name}
                </Typography>
                <Typography as="p" variant="legal" muted className="leading-snug mt-0.5">
                  {`${videoMetadata.width} × ${videoMetadata.height} (${videoMetadata.aspectRatio}) · ${videoMetadata.formattedDuration} · ${formatBytes(videoMetadata.size)}`}
                </Typography>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                disabled={isProcessing}
                onClick={openFilePicker}
                className="type-fluid type-button h-9 px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Replace
              </button>
              {onReset && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={onReset}
                  aria-label={`Remove ${videoMetadata.name}`}
                  className="size-9 shrink-0 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-50"
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
            <div className="relative w-full aspect-video max-h-[50vh] bg-black border-2 border-foreground rounded-corner overflow-hidden flex items-center justify-center">
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

            {/* Playback & scrub controls — constrained with min-w-0 so range slider never overflows mobile screen */}
            <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video preview" : "Play video preview"}
                className="size-9 shrink-0 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors"
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>

              <input
                type="range"
                min={0}
                max={Math.max(videoMetadata.duration, 0.01)}
                step={0.05}
                value={Math.min(previewTime, videoMetadata.duration)}
                onChange={seekPreview}
                aria-label="Seek video preview"
                aria-valuetext={`${formatPreviewTime(previewTime)} of ${videoMetadata.formattedDuration}`}
                className="flex-1 min-w-0 w-full"
              />

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
                  className="h-9 px-2.5 sm:px-3 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
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
                      className="text-xs font-semibold text-foreground hover:underline inline-flex items-center gap-1 disabled:opacity-50"
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
                  <div className="w-full h-2 rounded-corner border-2 border-foreground bg-secondary relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 bg-[var(--accent-primary)]/40"
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
                    className="absolute -translate-x-1/2 size-4 rounded-corner border-2 border-foreground bg-background hover:bg-muted cursor-ew-resize shadow-sm"
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
                    className="absolute -translate-x-1/2 size-4 rounded-corner border-2 border-foreground bg-foreground cursor-ew-resize shadow-sm"
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
