"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ExtractionSettings, VideoMetadata } from "@/types";
import {
  buildFrameTimestamps,
  estimateOutputBytes,
  formatBytes,
  MAX_ESTIMATED_OUTPUT_BYTES,
  MAX_EXTRACTED_FRAMES,
} from "@/lib/videoUtils";
import Typography from "./Typography";

interface ExtractionControlsProps {
  metadata: VideoMetadata;
  settings: ExtractionSettings;
  onSettingsChange: (settings: ExtractionSettings) => void;
  onStartExtraction: () => void;
  isProcessing: boolean;
}

const presets = [
  { label: "Dense", detail: "0.2s", interval: 0.2, fps: 5 },
  { label: "Detail", detail: "0.5s", interval: 0.5, fps: 2 },
  { label: "Standard", detail: "1.0s", interval: 1, fps: 1 },
  { label: "Sparse", detail: "2.0s", interval: 2, fps: 0.5 },
  { label: "Milestones", detail: "5.0s", interval: 5, fps: 0.2 },
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
    <section
      aria-labelledby="extraction-controls-heading"
      className="w-full border-2 border-foreground rounded-corner bg-background p-[var(--space-xl)] flex flex-col gap-[var(--space-xl)]"
    >
      {/* Header & Estimated Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-md)] pb-[var(--space-md)] border-b-2 border-border">
        <div>
          <Typography as="h2" id="extraction-controls-heading" variant="label" weight={600}>
            Extraction settings
          </Typography>
          <Typography as="p" variant="bodySm" muted>
            Configure capture interval and output format.
          </Typography>
        </div>

        <div className="flex items-center gap-[var(--space-lg)]">
          <div className="flex flex-col sm:items-end">
            <Typography as="span" variant="legal" muted>
              Estimated frames
            </Typography>
            <Typography as="span" variant="label" weight={600} className="font-mono">
              {estimatedCount.toLocaleString()} frames (~{formatBytes(estimatedBytes)})
            </Typography>
          </div>
        </div>
      </div>

      {/* Two-Column Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-xl)]">
        {/* Left: Timing & Rate */}
        <div className="flex flex-col gap-[var(--space-lg)]">
          <div className="flex items-center justify-between gap-2">
            <Typography as="span" variant="label" weight={600}>
              01 · Capture rate
            </Typography>
            <div role="group" aria-label="Capture rate mode" className="inline-flex rounded-corner border-2 border-foreground overflow-hidden">
              <button
                type="button"
                disabled={isProcessing}
                aria-pressed={settings.mode !== "fps"}
                onClick={() => setMode("interval")}
                className={`type-fluid type-button h-8 px-3 transition-colors ${
                  settings.mode !== "fps"
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Interval (sec)
              </button>
              <button
                type="button"
                disabled={isProcessing}
                aria-pressed={settings.mode === "fps"}
                onClick={() => setMode("fps")}
                className={`type-fluid type-button h-8 px-3 border-l-2 border-foreground transition-colors ${
                  settings.mode === "fps"
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                FPS
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-[var(--space-sm)]">
            <div className="flex items-center justify-between">
              <label htmlFor="capture-rate" className="type-fluid type-body-sm text-muted-foreground">
                {settings.mode === "fps" ? "Frames per second" : "Seconds between frames"}
              </label>
              <Typography as="span" variant="label" weight={600} className="font-mono">
                {settings.mode === "fps" ? `${settings.fps.toFixed(1)} FPS` : `Every ${settings.interval.toFixed(2)}s`}
              </Typography>
            </div>
            <input
              id="capture-rate"
              type="range"
              min="0.1"
              max={String(sliderMax)}
              step="0.1"
              value={sliderValue}
              disabled={isProcessing}
              aria-valuetext={
                settings.mode === "fps"
                  ? `${settings.fps.toFixed(1)} frames per second`
                  : `${settings.interval.toFixed(1)} seconds between frames`
              }
              onChange={(event) => {
                const value = Number.parseFloat(event.target.value);
                onSettingsChange(
                  settings.mode === "fps"
                    ? { ...settings, mode: "fps", fps: value, interval: 1 / value }
                    : { ...settings, mode: "interval", interval: value, fps: 1 / value }
                );
              }}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-[var(--space-sm)]">
            <Typography as="span" variant="legal" muted>
              Quick presets
            </Typography>
            <div className="grid grid-cols-5 gap-[var(--space-sm)]">
              {presets.map((preset) => {
                const active = settings.mode !== "fps" && Math.abs(settings.interval - preset.interval) < 0.05;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={isProcessing}
                    aria-pressed={active}
                    onClick={() => selectPreset(preset)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-corner border-2 transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="type-fluid type-legal font-semibold">{preset.label}</span>
                    <span className="type-fluid type-legal opacity-75 font-mono">{preset.detail}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Image Format & Quality */}
        <div className="flex flex-col gap-[var(--space-lg)]">
          <Typography as="span" variant="label" weight={600}>
            02 · Output format
          </Typography>

          <div role="group" aria-label="Output image format" className="grid grid-cols-3 gap-[var(--space-sm)]">
            {(["image/jpeg", "image/png", "image/webp"] as const).map((format) => {
              const selected = settings.format === format;
              const label = format === "image/jpeg" ? "JPEG" : format === "image/png" ? "PNG" : "WebP";
              const desc = format === "image/jpeg" ? "Compact" : format === "image/png" ? "Lossless" : "Modern";
              return (
                <button
                  key={format}
                  type="button"
                  disabled={isProcessing}
                  aria-pressed={selected}
                  onClick={() => onSettingsChange({ ...settings, format })}
                  className={`flex flex-col items-start p-3 rounded-corner border-2 transition-colors text-left ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="type-fluid type-label font-semibold">{label}</span>
                  <span className="type-fluid type-legal opacity-75">{desc}</span>
                </button>
              );
            })}
          </div>

          <div className={`flex flex-col gap-[var(--space-sm)] ${settings.format === "image/png" ? "opacity-40" : ""}`}>
            <div className="flex items-center justify-between">
              <label htmlFor="image-quality" className="type-fluid type-body-sm text-muted-foreground">
                {settings.format === "image/png" ? "Quality (Lossless PNG)" : "Image quality"}
              </label>
              <Typography as="span" variant="label" weight={600} className="font-mono">
                {Math.round(settings.quality * 100)}%
              </Typography>
            </div>
            <input
              id="image-quality"
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={settings.quality}
              disabled={isProcessing || settings.format === "image/png"}
              aria-label="Lossy image quality"
              onChange={(event) => onSettingsChange({ ...settings, quality: Number.parseFloat(event.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Safety Limit Warning */}
      {(overLimit || overOutputBudget) && (
        <div
          role="alert"
          className="border-2 border-foreground bg-[var(--toast-warning)] text-[var(--toast-text)] rounded-corner p-[var(--space-md)] flex items-start gap-[var(--space-md)]"
        >
          <AlertTriangle className="size-5 shrink-0 mt-0.5" aria-hidden="true" />
          <Typography as="p" variant="bodySm" className="text-[var(--toast-text)]">
            {overLimit
              ? `This setup would create ${estimatedCount.toLocaleString()} frames, above the ${MAX_EXTRACTED_FRAMES}-frame limit. Increase the interval or lower FPS.`
              : `Estimated image data is ${formatBytes(estimatedBytes)}, above the ${formatBytes(MAX_ESTIMATED_OUTPUT_BYTES)} safety limit. Use fewer frames or a smaller video.`}
          </Typography>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-md)] pt-[var(--space-md)] border-t-2 border-border">
        <Typography as="p" variant="legal" muted>
          Output: {estimatedCount.toLocaleString()} stills · {metadata.width} × {metadata.height} · Processed locally
        </Typography>

        <button
          type="button"
          disabled={isProcessing || blockedBySafetyLimit}
          onClick={onStartExtraction}
          className="type-fluid type-button-lg inline-flex items-center justify-center gap-2 h-11 px-6 rounded-corner bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isProcessing && <Loader2 className="size-4 animate-spin" />}
          <span>
            {isProcessing
              ? "Extracting frames..."
              : overLimit
              ? `Reduce below ${MAX_EXTRACTED_FRAMES} frames`
              : overOutputBudget
              ? "Reduce estimated output size"
              : `Extract ${estimatedCount.toLocaleString()} frames`}
          </span>
        </button>
      </div>
    </section>
  );
};
