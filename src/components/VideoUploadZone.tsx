"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { UploadCloud, Play, Pause, Clock, FileVideo, CheckCircle2, ArrowUpRight, Film, ScanLine, ShieldCheck, HardDrive, Sparkles, Monitor, Ratio, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { VideoMetadata } from "@/types";
import { formatBytes, loadVideoMetadata, MAX_ALLOWED_DURATION_SECONDS } from "@/lib/videoUtils";

interface VideoUploadZoneProps {
  videoMetadata: VideoMetadata | null;
  onVideoSelected: (metadata: VideoMetadata) => void;
  onError: (title: string, message: string) => void;
  isProcessing: boolean;
}

const frameTiles = [
  { tone: "ember", label: "01" },
  { tone: "rose", label: "02" },
  { tone: "gold", label: "03" },
  { tone: "wine", label: "04" },
  { tone: "copper", label: "05" },
  { tone: "smoke", label: "06" },
];

export const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  videoMetadata,
  onVideoSelected,
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
  const reduceMotion = useReducedMotion();

  useEffect(() => () => { fileRequestIdRef.current += 1; }, []);

  const processFile = useCallback(async (file: File) => {
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
  }, [onError, onVideoSelected]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Related-target checks keep the highlight from flickering across child elements.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
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
    if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
    // Clearing the input allows the same file to be selected again.
    e.currentTarget.value = "";
  };

  const openFilePicker = () => {
    if (!isLoadingFile && !isProcessing) fileInputRef.current?.click();
  };

  const handleDropzoneKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
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
        onError("Playback Unavailable", "Your browser could not start playback for this video. You may still be able to extract frames if its decoder is available.");
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

  const scrollToExtractionSettings = () => {
    document.getElementById("extraction-controls-heading")?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <div className="framelet-upload-component w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,.mp4,.webm,.mov,.mkv,.avi"
        onChange={handleFileInput}
        disabled={isProcessing}
        className="hidden"
      />

      <AnimatePresence mode="wait" initial={false}>
        {!videoMetadata ? (
          <motion.div
            key="upload-dropzone"
            initial={reduceMotion ? false : { opacity: 0, y: 18, clipPath: "inset(7% 0 0 0 round 24px)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0 0 0 round 24px)" }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            onKeyDown={handleDropzoneKeyDown}
            role="button"
            tabIndex={isLoadingFile || isProcessing ? -1 : 0}
            aria-disabled={isLoadingFile || isProcessing}
            aria-label="Choose a video or drop it here"
            className={`framelet-dropzone group ${isDragging ? "is-dragging" : ""} ${isLoadingFile ? "is-loading" : ""}`}
          >
            <div className="framelet-dropzone-background" aria-hidden="true" />
            <div className="framelet-dropzone-content">
              <div className="framelet-dropzone-copy">
                <div className="framelet-upload-label">
                  <span className={`framelet-upload-label-dot ${isLoadingFile ? "is-busy" : ""}`} />
                  {isLoadingFile ? "ANALYZING LOCAL FILE" : isDragging ? "RELEASE TO ADD VIDEO" : "YOUR NEXT FRAME STARTS HERE"}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isLoadingFile ? "loading" : isDragging ? "dragging" : "idle"}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                    transition={{ duration: 0.22 }}
                  >
                    <h3 className="framelet-dropzone-title">
                      {isLoadingFile ? <>Reading your <span>footage.</span></> : isDragging ? <>Drop it <span>like a frame.</span></> : <>Bring your video <span>into focus.</span></>}
                    </h3>
                    <p className="framelet-dropzone-description">
                      {isLoadingFile
                        ? "Checking duration, dimensions and browser decoder support. Your file stays on this device."
                        : "Find the exact still hidden inside your clip. Scrub through moments, capture at your pace, and keep the frames that matter."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="framelet-dropzone-actions" aria-hidden="true">
                  <span className="framelet-dropzone-cta">
                    {isLoadingFile ? <span className="framelet-cta-spinner" /> : <UploadCloud className="h-4 w-4" />}
                    <span>{isLoadingFile ? "Analyzing video…" : "Choose a video"}</span>
                    {!isLoadingFile && <span className="framelet-cta-circle"><ArrowUpRight className="h-4 w-4" /></span>}
                  </span>
                  <span className="framelet-dropzone-shortcut">OR DROP FILE ANYWHERE IN THIS AREA</span>
                </div>

                <div className="framelet-format-row">
                  <span>MP4</span><i /> <span>WEBM</span><i /> <span>MOV</span><i /> <span>MKV</span><i /> <span>AVI</span>
                  <span className="framelet-format-limit">UP TO {MAX_ALLOWED_DURATION_SECONDS}s</span>
                </div>
              </div>

              <div className="framelet-upload-visual" aria-hidden="true">
                <motion.div
                  className="framelet-upload-orbit framelet-upload-orbit-one"
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={{ duration: 38, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="framelet-upload-orbit framelet-upload-orbit-two"
                  animate={reduceMotion ? undefined : { rotate: -360 }}
                  transition={{ duration: 54, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="framelet-upload-film-stack"
                  animate={reduceMotion ? undefined : { y: [0, -7, 0], rotate: [-2, -1, -2] }}
                  transition={reduceMotion ? undefined : { duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="framelet-film-sheet framelet-film-sheet-back">
                    <span className="framelet-film-sheet-code">SEQUENCE / 002</span>
                    <div className="framelet-film-sheet-lines"><i /><i /><i /></div>
                  </div>
                  <div className="framelet-film-sheet framelet-film-sheet-front">
                    <div className="framelet-film-viewfinder"><i /><i /><i /><i /></div>
                    <Film className="framelet-upload-film-icon" strokeWidth={1.25} />
                    <div className="framelet-film-timecode"><span>00:00:12:08</span><span>● REC / LOCAL</span></div>
                    <motion.div
                      className="framelet-film-scanline"
                      animate={reduceMotion ? undefined : { y: [0, 180, 0], opacity: [0.25, 0.8, 0.25] }}
                      transition={reduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </motion.div>
                <div className="framelet-upload-mini-grid">
                  {frameTiles.map((tile, index) => (
                    <motion.div
                      key={tile.label}
                      className={`framelet-mini-frame tone-${tile.tone}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.07, duration: 0.35, ease: "easeOut" }}
                    >
                      <span>{tile.label}</span><i />
                    </motion.div>
                  ))}
                </div>
                <div className="framelet-upload-status-tag"><ScanLine className="h-3.5 w-3.5" /> FRAME EXTRACTION READY</div>
                <div className="framelet-upload-private-tag"><ShieldCheck className="h-3.5 w-3.5" /> LOCAL ONLY</div>
              </div>
            </div>
            <div className="framelet-dropzone-footer">
              <span><HardDrive className="h-3.5 w-3.5" /> Processed in your browser</span>
              <span><Sparkles className="h-3.5 w-3.5" /> Original frame dimensions</span>
              <span><CheckCircle2 className="h-3.5 w-3.5" /> No account required</span>
            </div>
            {isDragging && <motion.div className="framelet-drop-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><UploadCloud className="h-8 w-8" /><span>Release to inspect your video</span></motion.div>}
          </motion.div>
        ) : (
          <motion.div
            key="video-preview-card"
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="framelet-source-card"
          >
            <div className="framelet-source-card-top">
              <div className="framelet-source-status"><span /> VIDEO SOURCE READY <span className="framelet-source-divider">/</span> READY TO EXTRACT</div>
              {!isProcessing && <button type="button" onClick={openFilePicker} className="framelet-change-video"><span>Change video</span><ArrowUpRight className="h-3.5 w-3.5" /></button>}
            </div>

            <div className="framelet-source-layout">
              <div className={`framelet-source-preview ${isPlaying ? "is-playing" : ""}`}>
                <div className="framelet-source-ambient" aria-hidden="true"><span /><span /><span /></div>
                <div className="framelet-source-film-markings" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div>
                <video
                  ref={videoRef}
                  src={videoMetadata.url}
                  className="framelet-source-video"
                  onLoadedMetadata={() => setPreviewTime(0)}
                  onTimeUpdate={() => setPreviewTime(videoRef.current?.currentTime ?? 0)}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playsInline
                />
                <div className="framelet-source-preview-shade" aria-hidden="true" />
                <button type="button" onClick={togglePlay} aria-label={isPlaying ? "Pause video preview" : "Play video preview"} className="framelet-source-play">
                  <span>{isPlaying ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}</span>
                </button>
                <div className="framelet-source-preview-label"><span className="framelet-source-live-dot" /> <Film className="h-3.5 w-3.5" /> SOURCE MONITOR</div>
                <div className="framelet-source-preview-spec">{videoMetadata.width} × {videoMetadata.height}</div>
                <div className="framelet-source-playback">
                  <div className="framelet-source-playback-meta">
                    <span><b>{formatPreviewTime(previewTime)}</b><i>/</i>{videoMetadata.formattedDuration}</span>
                    <span className="framelet-source-play-state">{isPlaying ? "PLAYING PREVIEW" : "PREVIEW READY"}</span>
                  </div>
                  <input
                    className="framelet-source-seek"
                    type="range"
                    min={0}
                    max={Math.max(videoMetadata.duration, 0.01)}
                    step={0.05}
                    value={Math.min(previewTime, videoMetadata.duration)}
                    onChange={seekPreview}
                    aria-label="Seek video preview"
                    aria-valuetext={`${formatPreviewTime(previewTime)} of ${videoMetadata.formattedDuration}`}
                    style={{ "--source-progress": `${videoMetadata.duration > 0 ? (previewTime / videoMetadata.duration) * 100 : 0}%` } as React.CSSProperties}
                  />
                </div>
              </div>

              <div className="framelet-source-details">
                <div className="framelet-source-file-heading">
                  <div className="framelet-source-file-icon"><FileVideo className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1"><span className="framelet-source-label">CURRENT SOURCE <i>·</i> VIDEO INPUT</span><h3 title={videoMetadata.name}>{videoMetadata.name}</h3><span className="framelet-source-file-type">{videoMetadata.type?.replace("video/", "").toUpperCase() || "VIDEO"} <i /> {formatBytes(videoMetadata.size)} SOURCE FILE</span></div>
                </div>
                <div className="framelet-source-metrics">
                  <div><span className="framelet-source-metric-label"><Monitor /> RESOLUTION</span><strong>{videoMetadata.width} <i>×</i> {videoMetadata.height}</strong><small>Original dimensions</small></div>
                  <div><span className="framelet-source-metric-label"><Clock /> DURATION</span><strong>{videoMetadata.formattedDuration}</strong><small>Full source length</small></div>
                  <div><span className="framelet-source-metric-label"><Ratio /> ASPECT RATIO</span><strong>{videoMetadata.aspectRatio}</strong><small>{videoMetadata.width >= videoMetadata.height ? "Landscape frame" : "Portrait frame"}</small></div>
                  <div><span className="framelet-source-metric-label"><HardDrive /> FILE SIZE</span><strong>{formatBytes(videoMetadata.size)}</strong><small>Read locally</small></div>
                </div>
                <div className="framelet-source-ready-note"><span className="framelet-source-ready-pulse" /><div><strong>Source inspected successfully</strong><p>Video metadata is ready. Frames will be decoded in your browser; supported codecs can vary by browser.</p></div></div>
                <div className="framelet-source-bottomline"><span><ShieldCheck className="h-3.5 w-3.5" /> Stays on this device</span><button type="button" onClick={scrollToExtractionSettings}>Configure capture <ChevronDown className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
