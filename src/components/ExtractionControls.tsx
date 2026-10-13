"use client";

import React from "react";
import {
  Sliders,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Gauge,
  AlertTriangle,
  Clock3,
  Check,
  Film,
  ScanLine,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { ExtractionSettings, VideoMetadata } from "@/types";
import {
  buildFrameTimestamps,
  estimateOutputBytes,
  formatBytes,
  MAX_ESTIMATED_OUTPUT_BYTES,
  MAX_EXTRACTED_FRAMES,
} from "@/lib/videoUtils";

interface ExtractionControlsProps {
  metadata: VideoMetadata;
  settings: ExtractionSettings;
  onSettingsChange: (settings: ExtractionSettings) => void;
  onStartExtraction: () => void;
  isProcessing: boolean;
}

const presets = [
  { label: "Dense", detail: "0.2 sec", interval: 0.2, fps: 5, note: "More detail" },
  { label: "Detail", detail: "0.5 sec", interval: 0.5, fps: 2, note: "Close review" },
  { label: "Standard", detail: "1 sec", interval: 1, fps: 1, note: "Balanced", recommended: true },
  { label: "Sparse", detail: "2 sec", interval: 2, fps: 0.5, note: "Quick scan" },
  { label: "Milestones", detail: "5 sec", interval: 5, fps: 0.2, note: "Highlights" },
];

export const ExtractionControls: React.FC<ExtractionControlsProps> = ({
  metadata,
  settings,
  onSettingsChange,
  onStartExtraction,
  isProcessing,
}) => {
  const timestamps = buildFrameTimestamps(metadata.duration, settings);
  const estimatedCount = timestamps.length;
  const overLimit = estimatedCount > MAX_EXTRACTED_FRAMES;
  const estimatedBytes = estimateOutputBytes(estimatedCount, metadata.width, metadata.height, settings);
  const overOutputBudget = estimatedBytes > MAX_ESTIMATED_OUTPUT_BYTES;
  const blockedBySafetyLimit = overLimit || overOutputBudget;
  const sliderValue = settings.mode === "fps" ? settings.fps : settings.interval;
  const sliderMax = settings.mode === "fps" ? 10 : 5;
  const sliderProgress = Math.max(0, Math.min(100, ((sliderValue - 0.1) / (sliderMax - 0.1)) * 100));
  const qualityProgress = Math.max(0, Math.min(100, ((settings.quality - 0.5) / 0.5) * 100));
  const qualityLabel = settings.quality >= 0.9 ? "Fine detail" : settings.quality >= 0.75 ? "Balanced" : "Smaller files";

  const setMode = (mode: "interval" | "fps") => {
    if (isProcessing) return;
    if (mode === "interval") {
      const interval = settings.interval || 1;
      onSettingsChange({ ...settings, mode, interval, fps: 1 / interval });
    } else {
      const fps = settings.fps || 1;
      onSettingsChange({ ...settings, mode, fps, interval: 1 / fps });
    }
  };

  const selectPreset = (preset: (typeof presets)[number]) => {
    if (isProcessing) return;
    onSettingsChange({ ...settings, mode: "interval", interval: preset.interval, fps: preset.fps });
  };

  return (
    <motion.section
      aria-labelledby="extraction-controls-heading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.2, 0.7, 0.2, 1] }}
      className="framelet-extraction-panel framelet-workspace-section w-full relative overflow-hidden"
    >
      <div className="framelet-settings-ambient" aria-hidden="true" />
      <div className="framelet-extraction-header">
        <div className="framelet-settings-heading">
          <div className="framelet-settings-eyebrow">
            <span className="framelet-settings-eyebrow-icon"><Sliders size={14} aria-hidden="true" /></span>
            <span>Extraction settings</span>
            <span className="framelet-settings-step">02 / 03</span>
          </div>
          <h2 id="extraction-controls-heading">Make every frame count<span>.</span></h2>
          <p>Fine-tune how often we capture and how each still is saved. Your original video stays untouched.</p>
        </div>

        <div className="framelet-extraction-metrics" aria-label="Estimated export details">
          <motion.div
            key={`count-${estimatedCount}`}
            className="framelet-extraction-metric framelet-stat-frames"
            initial={{ opacity: 0.65, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          >
            <span className="framelet-stat-icon"><Layers size={18} aria-hidden="true" /></span>
            <span className="framelet-stat-copy">
              <span className="framelet-stat-label">Estimated frames</span>
              <strong>{estimatedCount.toLocaleString()}</strong>
            </span>
            <span className="framelet-stat-corner" aria-hidden="true"><ArrowRight size={13} /></span>
          </motion.div>
          <motion.div
            key={`bytes-${estimatedBytes}`}
            className="framelet-extraction-metric framelet-stat-size"
            initial={{ opacity: 0.65, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
          >
            <span className="framelet-stat-icon"><ImageIcon size={18} aria-hidden="true" /></span>
            <span className="framelet-stat-copy">
              <span className="framelet-stat-label">Approx. image data</span>
              <strong>{formatBytes(estimatedBytes)}</strong>
            </span>
            <span className="framelet-stat-corner" aria-hidden="true"><ArrowRight size={13} /></span>
          </motion.div>
        </div>
      </div>

      <div className="framelet-extraction-grid">
        <motion.div
          className="framelet-setting-card framelet-capture-settings"
          initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.08 }}
        >
          <div className="framelet-setting-card-heading">
            <div className="framelet-setting-card-title-group">
              <span className="framelet-card-index">01 / TIMING</span>
              <h3><Clock3 size={17} aria-hidden="true" /> Capture rate</h3>
            </div>
            <span className={`framelet-control-status ${isProcessing ? "is-locked" : ""}`}>
              <span />{isProcessing ? "Locked" : "Adjustable"}
            </span>
          </div>

          <div role="group" aria-label="Capture rate mode" className="framelet-mode-switch">
            <button
              type="button" disabled={isProcessing} aria-pressed={settings.mode !== "fps"}
              onClick={() => setMode("interval")}
              className={`framelet-mode-button ${settings.mode !== "fps" ? "is-active" : ""}`}
            >
              <Clock3 size={14} aria-hidden="true" /><span>Interval</span>
            </button>
            <button
              type="button" disabled={isProcessing} aria-pressed={settings.mode === "fps"}
              onClick={() => setMode("fps")}
              className={`framelet-mode-button ${settings.mode === "fps" ? "is-active" : ""}`}
            >
              <Gauge size={14} aria-hidden="true" /><span>Frames per second</span>
            </button>
          </div>

          <div className="framelet-rate-control">
            <div className="framelet-rate-readout-row">
              <label htmlFor="capture-rate">{settings.mode === "fps" ? "Frames per second" : "Seconds between frames"}</label>
              <motion.span key={`${settings.mode}-${sliderValue}`} className="framelet-rate-readout" initial={{ scale: 0.94, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}>
                {settings.mode === "fps" ? `${settings.fps.toFixed(1)} FPS` : `Every ${settings.interval.toFixed(2)}s`}
              </motion.span>
            </div>
            <div className="framelet-slider-shell" style={{ "--slider-progress": `${sliderProgress}%` } as React.CSSProperties}>
              <input
                id="capture-rate" type="range" min="0.1" max={String(sliderMax)} step="0.1" value={sliderValue}
                disabled={isProcessing}
                aria-valuetext={settings.mode === "fps" ? `${settings.fps.toFixed(1)} frames per second` : `${settings.interval.toFixed(1)} seconds between frames`}
                onChange={(event) => {
                  const value = Number.parseFloat(event.target.value);
                  onSettingsChange(settings.mode === "fps"
                    ? { ...settings, mode: "fps", fps: value, interval: 1 / value }
                    : { ...settings, mode: "interval", interval: value, fps: 1 / value });
                }}
              />
            </div>
            <div className="framelet-slider-range-labels">
              {settings.mode === "fps" ? <><span>0.1 FPS <i>· slower</i></span><span>10 FPS <i>· smoother</i></span></> : <><span>0.1s <i>· dense</i></span><span>5s <i>· overview</i></span></>}
            </div>
          </div>

          <div className="framelet-presets-wrap">
            <div className="framelet-presets-heading"><span>Quick presets</span><span>Choose a starting point</span></div>
            <div className="framelet-preset-grid">
              {presets.map((preset, index) => {
                const active = settings.mode !== "fps" && Math.abs(settings.interval - preset.interval) < 0.05;
                const presetCount = buildFrameTimestamps(metadata.duration, { ...settings, mode: "interval", interval: preset.interval, fps: preset.fps }).length;
                return (
                  <motion.button
                    key={preset.label} type="button" disabled={isProcessing} aria-pressed={active}
                    onClick={() => selectPreset(preset)}
                    whileHover={isProcessing ? undefined : { y: -2 }} whileTap={isProcessing ? undefined : { scale: 0.98 }}
                    className={`framelet-preset-card ${active ? "is-active" : ""}`}
                    transition={{ duration: 0.18, delay: index * 0.012 }}
                  >
                    <span className="framelet-preset-topline"><span className="framelet-preset-dot" />{preset.note}</span>
                    <strong>{preset.label}</strong>
                    <span className="framelet-preset-detail">{preset.detail}</span>
                    <span className="framelet-preset-count">~{presetCount.toLocaleString()} frames</span>
                    {active && <span className="framelet-preset-selected"><Check size={10} aria-label="Selected" /></span>}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="framelet-sampling-preview" aria-label={`Sampling preview across ${metadata.formattedDuration}`}>
            <div className="framelet-sampling-preview-top"><span><ScanLine size={12} aria-hidden="true" /> Sampling preview</span><strong>{metadata.formattedDuration}</strong></div>
            <div className="framelet-sampling-ruler" aria-hidden="true">
              {Array.from({ length: 30 }, (_, index) => {
                const cadence = settings.mode === "fps" ? 1 / settings.fps : settings.interval;
                const stride = Math.max(1, Math.round(cadence * 2));
                return <i key={index} className={index % stride === 0 ? "is-sampled" : ""} />;
              })}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="framelet-setting-card framelet-output-settings"
          initial={{ opacity: 0, y: 13 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.15 }}
        >
          <div className="framelet-setting-card-heading">
            <div className="framelet-setting-card-title-group">
              <span className="framelet-card-index">02 / OUTPUT</span>
              <h3><ImageIcon size={17} aria-hidden="true" /> Image format</h3>
            </div>
            <span className="framelet-format-status"><ShieldCheck size={12} aria-hidden="true" /> Local export</span>
          </div>

          <div role="group" aria-label="Output image format" className="framelet-format-options">
            {(["image/jpeg", "image/png", "image/webp"] as const).map((format) => {
              const selected = settings.format === format;
              const label = format === "image/jpeg" ? "JPEG" : format === "image/png" ? "PNG" : "WebP";
              const extension = format === "image/jpeg" ? ".jpg" : format === "image/png" ? ".png" : ".webp";
              const description = format === "image/jpeg" ? "Compact files" : format === "image/png" ? "Lossless detail" : "Modern compression";
              return (
                <button
                  key={format} type="button" disabled={isProcessing} aria-pressed={selected}
                  onClick={() => onSettingsChange({ ...settings, format })}
                  className={`framelet-format-card ${selected ? "is-active" : ""}`}
                >
                  <span className="framelet-format-card-top"><span className="framelet-format-file-icon"><Film size={17} aria-hidden="true" /></span>{selected && <span className="framelet-format-check"><Check size={12} aria-hidden="true" /></span>}</span>
                  <strong>{label}</strong>
                  <span className="framelet-format-description">{description}</span>
                  <span className="framelet-format-extension">{extension}</span>
                </button>
              );
            })}
          </div>

          <div className={`framelet-quality-control ${settings.format === "image/png" ? "is-disabled" : ""}`}>
            <div className="framelet-quality-heading">
              <div><label htmlFor="image-quality">Image quality</label><span>{settings.format === "image/png" ? "Not used for PNG" : qualityLabel}</span></div>
              <strong>{Math.round(settings.quality * 100)}<small>%</small></strong>
            </div>
            <div className="framelet-slider-shell framelet-quality-slider" style={{ "--slider-progress": `${settings.format === "image/png" ? 100 : qualityProgress}%` } as React.CSSProperties}>
              <input
                id="image-quality" type="range" min="0.5" max="1.0" step="0.05" value={settings.quality}
                disabled={isProcessing || settings.format === "image/png"}
                aria-label="Lossy image quality"
                onChange={(event) => onSettingsChange({ ...settings, quality: Number.parseFloat(event.target.value) })}
              />
            </div>
            <p>{settings.format === "image/png" ? "PNG preserves image detail without a lossy quality setting." : "Higher quality keeps more detail. Lower quality can reduce file size."}</p>
          </div>

          {(overLimit || overOutputBudget) && <div role="alert" className="framelet-limit-warning"><AlertTriangle size={16} aria-hidden="true" /><span>{overLimit ? `This setup would create ${estimatedCount.toLocaleString()} frames, above the ${MAX_EXTRACTED_FRAMES}-frame limit. Increase the interval or lower FPS.` : `Estimated image data is ${formatBytes(estimatedBytes)}, above the ${formatBytes(MAX_ESTIMATED_OUTPUT_BYTES)} safety limit. Use fewer frames or a smaller video.`}</span></div>}

          <div className="framelet-export-summary">
            <span><span className="framelet-export-summary-label">Output</span><strong>{estimatedCount.toLocaleString()} stills <i>·</i> {settings.format === "image/jpeg" ? "JPEG" : settings.format === "image/png" ? "PNG" : "WebP"}</strong></span>
            <span><span className="framelet-export-summary-label">Dimensions</span><strong>{metadata.width} × {metadata.height}</strong></span>
          </div>

          <div className="framelet-extract-action-wrap">
            <motion.button
              whileHover={{ scale: isProcessing || blockedBySafetyLimit ? 1 : 1.012 }}
              whileTap={{ scale: isProcessing || blockedBySafetyLimit ? 1 : 0.99 }}
              disabled={isProcessing || blockedBySafetyLimit}
              onClick={onStartExtraction}
              className="framelet-extract-action"
            >
              <span className="framelet-extract-action-glow" aria-hidden="true" />
              <span className="framelet-extract-action-main"><Sparkles size={17} aria-hidden="true" /><span>{isProcessing ? "Capturing frames…" : overLimit ? `Reduce below ${MAX_EXTRACTED_FRAMES} frames` : overOutputBudget ? "Reduce estimated output size" : `Extract ${estimatedCount.toLocaleString()} frames`}</span></span>
              <span className="framelet-extract-action-arrow"><ArrowRight size={17} aria-hidden="true" /></span>
            </motion.button>
            <p className="framelet-estimate-note"><ShieldCheck size={11} aria-hidden="true" /> Processed locally · Estimate only; actual size varies by content.</p>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
