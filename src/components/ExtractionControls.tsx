"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ExtractionSettings, ResolutionScale, VideoMetadata } from "@/types";
import {
  buildFrameTimestamps,
  calculateScaledDimensions,
  DEFAULT_FILENAME_TEMPLATE,
  estimateOutputBytes,
  formatBytes,
  formatFrameFilename,
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
  { label: "Every 5s", detail: "5.0s", interval: 5, fps: 0.2 },
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
  const scaledDims = calculateScaledDimensions(metadata.width, metadata.height, settings.scale);
  const estimatedBytes = estimateOutputBytes(
    estimatedCount,
    scaledDims.width,
    scaledDims.height,
    settings
  );
  const previewExt =
    settings.format === "image/png" ? "png" : settings.format === "image/webp" ? "webp" : "jpg";
  const filenamePreview = formatFrameFilename(settings.filenameTemplate, {
    baseName: metadata.name,
    index: 1,
    formattedTime: "00:01.00",
    width: scaledDims.width,
    height: scaledDims.height,
    extension: previewExt,
  });
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
      className="w-full border-2 border-foreground rounded-corner bg-background p-4 sm:p-[var(--space-xl)] flex flex-col gap-5 sm:gap-[var(--space-xl)] overflow-hidden"
    >
      {/* Header & Estimated Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-[var(--space-md)] pb-3 sm:pb-[var(--space-md)] border-b-2 border-border">
        <div>
          <Typography as="h2" id="extraction-controls-heading" variant="label" weight={600}>
            Extraction settings
          </Typography>
          <Typography as="p" variant="bodySm" muted>
            Configure capture interval and output format.
          </Typography>
        </div>

        <div className="flex flex-col sm:items-end pt-1 sm:pt-0">
          <Typography as="span" variant="legal" muted>
            Estimated frames
          </Typography>
          <Typography as="span" variant="label" weight={600} className="font-mono">
            {estimatedCount.toLocaleString()} frames (up to ~{formatBytes(estimatedBytes)})
          </Typography>
        </div>
      </div>

      {/* Two-Column Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-[var(--space-xl)]">
        {/* Left: Timing & Rate */}
        <div className="flex flex-col gap-4 sm:gap-[var(--space-lg)] min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Typography as="span" variant="label" weight={600} className="shrink-0">
              01 · Capture rate
            </Typography>
            <div
              role="group"
              aria-label="Capture rate mode"
              className="inline-flex rounded-corner border-2 border-foreground overflow-hidden shrink-0"
            >
              <button
                type="button"
                disabled={isProcessing}
                aria-pressed={settings.mode !== "fps"}
                onClick={() => setMode("interval")}
                className={`text-xs font-semibold h-8 px-3 whitespace-nowrap inline-flex items-center justify-center transition-colors ${
                  settings.mode !== "fps"
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                Interval
              </button>
              <button
                type="button"
                disabled={isProcessing}
                aria-pressed={settings.mode === "fps"}
                onClick={() => setMode("fps")}
                className={`text-xs font-semibold h-8 px-3 whitespace-nowrap inline-flex items-center justify-center border-l-2 border-foreground transition-colors ${
                  settings.mode === "fps"
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                FPS
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="capture-rate" className="text-xs sm:text-sm text-muted-foreground">
                {settings.mode === "fps" ? "Frames per second" : "Seconds between frames"}
              </label>
              <span className="text-xs sm:text-sm font-semibold font-mono text-foreground shrink-0">
                {settings.mode === "fps"
                  ? `${settings.fps.toFixed(1)} FPS`
                  : `Every ${settings.interval.toFixed(2)}s`}
              </span>
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

          <div className="flex flex-col gap-2">
            <Typography as="span" variant="legal" muted>
              Quick presets
            </Typography>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {presets.map((preset) => {
                const active =
                  settings.mode !== "fps" && Math.abs(settings.interval - preset.interval) < 0.05;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={isProcessing}
                    aria-pressed={active}
                    onClick={() => selectPreset(preset)}
                    className={`flex flex-col items-center justify-center py-2 px-2 rounded-corner border-2 transition-colors min-w-0 ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-xs font-semibold truncate max-w-full">
                      {preset.label}
                    </span>
                    <span
                      className={`text-xs font-mono ${active ? "text-background/90" : "text-muted-foreground"}`}
                    >
                      {preset.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Image Format & Quality */}
        <div className="flex flex-col gap-4 sm:gap-[var(--space-lg)] min-w-0">
          <Typography as="span" variant="label" weight={600}>
            02 · Output format
          </Typography>

          <div role="group" aria-label="Output image format" className="grid grid-cols-3 gap-2">
            {(["image/jpeg", "image/png", "image/webp"] as const).map((format) => {
              const selected = settings.format === format;
              const label =
                format === "image/jpeg" ? "JPEG" : format === "image/png" ? "PNG" : "WebP";
              const desc =
                format === "image/jpeg"
                  ? "Compact"
                  : format === "image/png"
                    ? "Lossless"
                    : "Modern";
              return (
                <button
                  key={format}
                  type="button"
                  disabled={isProcessing}
                  aria-pressed={selected}
                  onClick={() => onSettingsChange({ ...settings, format })}
                  className={`flex flex-col items-start p-2.5 sm:p-3 rounded-corner border-2 transition-colors text-left min-w-0 ${
                    selected
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="text-xs sm:text-sm font-semibold">{label}</span>
                  <span
                    className={`text-xs truncate max-w-full ${selected ? "text-background/90" : "text-muted-foreground"}`}
                  >
                    {desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            className={`flex flex-col gap-2 ${settings.format === "image/png" ? "opacity-40" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="image-quality" className="text-xs sm:text-sm text-muted-foreground">
                {settings.format === "image/png" ? "Quality (Lossless PNG)" : "Image quality"}
              </label>
              <span className="text-xs sm:text-sm font-semibold font-mono text-foreground shrink-0">
                {Math.round(settings.quality * 100)}%
              </span>
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
              onChange={(event) =>
                onSettingsChange({ ...settings, quality: Number.parseFloat(event.target.value) })
              }
              className="w-full"
            />
          </div>

          {/* Resolution Scale */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Typography as="span" variant="legal" muted>
                Resolution scale
              </Typography>
              <span className="text-xs font-mono font-semibold text-foreground">
                {scaledDims.width} × {scaledDims.height}
              </span>
            </div>
            <div role="group" aria-label="Resolution scale" className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: "original", label: "Original" },
                  { value: "1080p", label: "1080p" },
                  { value: "720p", label: "720p" },
                ] as { value: ResolutionScale; label: string }[]
              ).map((option) => {
                const active = (settings.scale ?? "original") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isProcessing}
                    aria-pressed={active}
                    onClick={() => onSettingsChange({ ...settings, scale: option.value })}
                    className={`h-9 px-2 rounded-corner border-2 text-xs font-semibold transition-colors ${
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-foreground bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filename Template */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="filename-template" className="text-xs text-muted-foreground">
                Filename template
              </label>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  onSettingsChange({ ...settings, filenameTemplate: DEFAULT_FILENAME_TEMPLATE })
                }
                className="text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
              >
                Reset
              </button>
            </div>
            <input
              id="filename-template"
              type="text"
              disabled={isProcessing}
              value={settings.filenameTemplate ?? DEFAULT_FILENAME_TEMPLATE}
              onChange={(event) =>
                onSettingsChange({ ...settings, filenameTemplate: event.target.value })
              }
              placeholder={DEFAULT_FILENAME_TEMPLATE}
              className="h-9 w-full rounded-corner border-2 border-foreground bg-background px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground font-mono truncate" title={filenamePreview}>
              Preview: {filenamePreview}
            </p>
            <p className="text-xs text-muted-foreground">
              Tokens: <code className="font-mono">{"{name}"}</code>,{" "}
              <code className="font-mono">{"{index}"}</code>,{" "}
              <code className="font-mono">{"{timestamp}"}</code>,{" "}
              <code className="font-mono">{"{width}x{height}"}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Safety Limit Warning */}
      {(overLimit || overOutputBudget) && (
        <div
          role="alert"
          className="border-2 border-foreground bg-[var(--toast-warning)] text-[var(--toast-text)] rounded-corner p-3 flex items-start gap-2.5"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-[var(--space-md)] border-t-2 border-border">
        <Typography as="p" variant="legal" muted>
          Output: {estimatedCount.toLocaleString()} stills · {scaledDims.width} ×{" "}
          {scaledDims.height} · Processed locally
        </Typography>

        <button
          type="button"
          disabled={isProcessing || blockedBySafetyLimit}
          onClick={onStartExtraction}
          className="type-fluid type-button-lg w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-corner border-2 border-foreground bg-[var(--brand-red)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
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
