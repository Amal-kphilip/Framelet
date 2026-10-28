"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, FileVideo, Loader2, X } from "lucide-react";
import { VideoMetadata } from "@/types";
import { formatBytes, loadVideoMetadata, MAX_ALLOWED_DURATION_SECONDS } from "@/lib/videoUtils";
import Typography from "./Typography";

interface VideoUploadZoneProps {
  videoMetadata: VideoMetadata | null;
  onVideoSelected: (metadata: VideoMetadata) => void;
  onReset?: () => void;
  onError: (title: string, message: string) => void;
  isProcessing: boolean;
}

const ACCEPTED_EXTENSIONS_LABEL = `MP4 · WEBM · MOV · MKV · AVI · UP TO ${MAX_ALLOWED_DURATION_SECONDS}S`;

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  videoMetadata,
  onVideoSelected,
  onReset,
  onError,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isProcessing && !isLoadingFile) {
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
            isDragging ? "border-[var(--accent-primary)] bg-[var(--accent-secondary)]" : "border-foreground"
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
              <FileVideo className="shrink-0 size-5 text-foreground mt-0.5 sm:mt-0" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <Typography as="h3" variant="label" weight={600} className="truncate" title={videoMetadata.name}>
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
          <div className="flex flex-col gap-3 w-full">
            <div className="relative w-full aspect-video max-h-72 sm:max-h-80 bg-black border-2 border-foreground rounded-corner overflow-hidden flex items-center justify-center">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
