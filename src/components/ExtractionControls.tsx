"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { AlertTriangle, ChevronDown, Loader2, Sparkles } from "lucide-react";
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
import { calculateGaugeLevel } from "@/lib/uiHelpers";

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

const TEMPLATE_TOKENS = ["{name}", "{index}", "{timestamp}", "{width}x{height}"] as const;

function AnimatedCounter({ value, reduced }: { value: number; reduced: boolean | null }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (reduced || prevRef.current === value) {
      prevRef.current = value;
      setDisplayValue(value);
      return;
    }

    const start = prevRef.current;
    const diff = value - start;
    const duration = 260;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + diff * eased));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [value, reduced]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export const ExtractionControls: React.FC<ExtractionControlsProps> = ({
  metadata,
  settings,
  onSettingsChange,
  onStartExtraction,
  isProcessing,
}) => {
  const reduced = useReducedMotion();
  const [rateActive, setRateActive] = useState(false);
  const [qualityActive, setQualityActive] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const templateInputRef = useRef<HTMLInputElement | null>(null);

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
  const gauge = calculateGaugeLevel(estimatedBytes, MAX_ESTIMATED_OUTPUT_BYTES);

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
  const sliderMin = 0.1;
  const sliderMax = settings.mode === "fps" ? 10 : 5;
  const ratePercent = ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100;
  const qualityPercent = ((settings.quality - 0.5) / 0.5) * 100;

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

  const handleRadioKeyDown = <T extends string>(
    e: React.KeyboardEvent<HTMLButtonElement>,
    options: readonly T[],
    current: T,
    onSelect: (val: T) => void
  ) => {
    const idx = options.indexOf(current);
    if (idx === -1) return;
    let nextIdx = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIdx = (idx + 1) % options.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIdx = (idx - 1 + options.length) % options.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = options.length - 1;
    }
    if (nextIdx >= 0) {
      e.preventDefault();
      onSelect(options[nextIdx]);
      const group = e.currentTarget.closest('[role="radiogroup"]');
      const radios = group?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      radios?.[nextIdx]?.focus();
    }
  };

  const insertTokenAtCursor = (token: string) => {
    if (isProcessing) return;
    const current = settings.filenameTemplate ?? DEFAULT_FILENAME_TEMPLATE;
    const input = templateInputRef.current;
    if (!input) {
      onSettingsChange({ ...settings, filenameTemplate: `${current}${token}` });
      return;
    }
    const start = input.selectionStart ?? current.length;
    const end = input.selectionEnd ?? current.length;
    const nextValue = `${current.slice(0, start)}${token}${current.slice(end)}`;
    onSettingsChange({ ...settings, filenameTemplate: nextValue });
    window.requestAnimationFrame(() => {
      input.focus();
      const pos = start + token.length;
      input.setSelectionRange(pos, pos);
    });
  };

  const rateModes = ["interval", "fps"] as const;
  const activeRateMode = settings.mode === "fps" ? "fps" : "interval";
  const formatOptions = ["image/jpeg", "image/png", "image/webp"] as const;
  const scaleOptions: { value: ResolutionScale; label: string }[] = [
    { value: "original", label: "Original" },
    { value: "1080p", label: "1080p" },
    { value: "720p", label: "720p" },
  ];
  const scaleValues = ["original", "1080p", "720p"] as const;
  const activeScale = settings.scale ?? "original";

  return (
    <section
      aria-labelledby="extraction-controls-heading"
      className="w-full flex flex-col gap-5 overflow-hidden"
    >
      {/* Header & Estimated Stat Pill + 512 MiB Gauge */}
      <div className="glass rounded-3xl p-4 sm:p-6 border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2
            id="extraction-controls-heading"
            className="font-display font-700 text-base sm:text-lg text-foreground"
          >
            Extraction settings
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure capture timing, output format, and resolution.
          </p>
        </div>

        <div className="flex flex-col gap-2 min-w-[230px] rounded-2xl border border-brand-border bg-brand-card/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">Estimated output</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent/15 border border-brand-accent/40 px-2.5 py-0.5 text-xs font-mono font-semibold text-brand-accentText tabular-nums">
              <AnimatedCounter value={estimatedCount} reduced={reduced} /> frames · up to ~
              {formatBytes(estimatedBytes)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden"
              title={`${gauge.percent}% of ${formatBytes(MAX_ESTIMATED_OUTPUT_BYTES)} safety guardrail`}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  gauge.level === "danger"
                    ? "bg-destructive"
                    : gauge.level === "warning"
                      ? "bg-amber-500"
                      : "bg-brand-accent"
                }`}
                style={{ width: `${gauge.percent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">
              {gauge.percent}% of 512 MiB
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Glass Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Step 01: Capture Rate */}
        <div className="glass rounded-3xl p-5 sm:p-6 border border-brand-border flex flex-col gap-5 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="font-display font-700 text-sm sm:text-base text-foreground inline-flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-accent/15 text-brand-accentText border border-brand-accent/30">
                01
              </span>
              Capture rate
            </span>

            {/* Segmented Control 1: Interval / FPS */}
            <div
              role="radiogroup"
              aria-label="Capture rate mode"
              className="relative inline-grid grid-cols-2 p-1 rounded-xl border border-brand-border bg-brand-surface/80 shrink-0"
            >
              {rateModes.map((mode) => {
                const selected = activeRateMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    tabIndex={selected ? 0 : -1}
                    disabled={isProcessing}
                    onClick={() => setMode(mode)}
                    onKeyDown={(e) => handleRadioKeyDown(e, rateModes, activeRateMode, setMode)}
                    className={`relative z-10 h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      selected
                        ? "text-brand-accentText"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId={reduced ? undefined : "capture-rate-pill"}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-brand-accent/15 border border-brand-accent -z-10"
                      />
                    )}
                    {mode === "interval" ? "Interval" : "FPS"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider with accent gradient fill & value bubble */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="capture-rate" className="text-xs sm:text-sm text-muted-foreground">
                {settings.mode === "fps" ? "Frames per second" : "Seconds between frames"}
              </label>
              <span className="text-xs sm:text-sm font-semibold font-mono text-foreground tabular-nums">
                {settings.mode === "fps"
                  ? `${settings.fps.toFixed(1)} FPS`
                  : `Every ${settings.interval.toFixed(2)}s`}
              </span>
            </div>

            <div className="relative pt-4 pb-1">
              <AnimatePresence>
                {rateActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ duration: reduced ? 0 : 0.15 }}
                    style={{ left: `clamp(24px, ${ratePercent}%, calc(100% - 24px))` }}
                    className="absolute -top-2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-brand-accent text-[#0b0b0d] text-[11px] font-mono font-bold whitespace-nowrap pointer-events-none shadow-accent"
                  >
                    {settings.mode === "fps"
                      ? `${settings.fps.toFixed(1)} fps`
                      : `${settings.interval.toFixed(1)}s`}
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                id="capture-rate"
                type="range"
                min={String(sliderMin)}
                max={String(sliderMax)}
                step="0.1"
                value={sliderValue}
                disabled={isProcessing}
                onPointerDown={() => setRateActive(true)}
                onPointerUp={() => setRateActive(false)}
                onPointerCancel={() => setRateActive(false)}
                onFocus={() => setRateActive(true)}
                onBlur={() => setRateActive(false)}
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
                style={{
                  background: `linear-gradient(to right, var(--slider-accent) 0%, var(--slider-accent) ${ratePercent}%, var(--slider-track) ${ratePercent}%, var(--slider-track) 100%)`,
                }}
                className="accent-slider w-full"
              />
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Quick presets</span>
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
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border transition-all duration-200 min-w-0 hover:-translate-y-0.5 disabled:hover:translate-y-0 ${
                      active
                        ? "bg-brand-accent/15 border-brand-accent text-brand-accentText shadow-accent"
                        : "border-brand-border bg-brand-card/60 text-foreground hover:border-brand-accent/40 hover:bg-brand-card"
                    }`}
                  >
                    <span className="text-xs font-semibold truncate max-w-full">
                      {preset.label}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        active ? "text-brand-accentText/90" : "text-muted-foreground"
                      }`}
                    >
                      {preset.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 02: Output Format, Quality & Resolution */}
        <div className="glass rounded-3xl p-5 sm:p-6 border border-brand-border flex flex-col gap-5 min-w-0">
          <span className="font-display font-700 text-sm sm:text-base text-foreground inline-flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-brand-accent/15 text-brand-accentText border border-brand-accent/30">
              02
            </span>
            Output format
          </span>

          {/* Segmented Control 2: JPEG / PNG / WebP */}
          <div
            role="radiogroup"
            aria-label="Output image format"
            className="relative grid grid-cols-3 gap-1 p-1 rounded-2xl border border-brand-border bg-brand-surface/80"
          >
            {formatOptions.map((format) => {
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
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  disabled={isProcessing}
                  onClick={() => onSettingsChange({ ...settings, format })}
                  onKeyDown={(e) =>
                    handleRadioKeyDown(e, formatOptions, settings.format, (fmt) =>
                      onSettingsChange({ ...settings, format: fmt })
                    )
                  }
                  className={`relative z-10 flex flex-col items-start p-2.5 sm:p-3 rounded-xl text-left transition-colors min-w-0 ${
                    selected
                      ? "text-brand-accentText"
                      : "text-foreground hover:text-brand-accentText"
                  }`}
                >
                  {selected && (
                    <motion.span
                      layoutId={reduced ? undefined : "output-format-pill"}
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-brand-accent/15 border border-brand-accent -z-10"
                    />
                  )}
                  <span className="text-xs sm:text-sm font-semibold">{label}</span>
                  <span
                    className={`text-xs truncate max-w-full ${
                      selected ? "text-brand-accentText/85" : "text-muted-foreground"
                    }`}
                  >
                    {desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quality Slider */}
          <div
            className={`flex flex-col gap-2 ${
              settings.format === "image/png" ? "opacity-45 pointer-events-none" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="image-quality" className="text-xs sm:text-sm text-muted-foreground">
                {settings.format === "image/png" ? "Quality (Lossless PNG)" : "Image quality"}
              </label>
              <span className="text-xs sm:text-sm font-semibold font-mono text-foreground shrink-0 tabular-nums">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>

            <div className="relative pt-4 pb-1">
              <AnimatePresence>
                {qualityActive && settings.format !== "image/png" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.92 }}
                    transition={{ duration: reduced ? 0 : 0.15 }}
                    style={{ left: `clamp(24px, ${qualityPercent}%, calc(100% - 24px))` }}
                    className="absolute -top-2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-brand-accent text-[#0b0b0d] text-[11px] font-mono font-bold whitespace-nowrap pointer-events-none shadow-accent"
                  >
                    {Math.round(settings.quality * 100)}%
                  </motion.div>
                )}
              </AnimatePresence>

              <input
                id="image-quality"
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={settings.quality}
                disabled={isProcessing || settings.format === "image/png"}
                onPointerDown={() => setQualityActive(true)}
                onPointerUp={() => setQualityActive(false)}
                onPointerCancel={() => setQualityActive(false)}
                onFocus={() => setQualityActive(true)}
                onBlur={() => setQualityActive(false)}
                aria-label="Lossy image quality"
                onChange={(event) =>
                  onSettingsChange({ ...settings, quality: Number.parseFloat(event.target.value) })
                }
                style={{
                  background: `linear-gradient(to right, var(--slider-accent) 0%, var(--slider-accent) ${qualityPercent}%, var(--slider-track) ${qualityPercent}%, var(--slider-track) 100%)`,
                }}
                className="accent-slider w-full"
              />
            </div>
          </div>

          {/* Segmented Control 3: Resolution Scale */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">Resolution scale</span>
              <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
                {activeScale !== "original"
                  ? `Output: ${scaledDims.width} × ${scaledDims.height}`
                  : `${scaledDims.width} × ${scaledDims.height}`}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Resolution scale"
              className="relative grid grid-cols-3 gap-1 p-1 rounded-2xl border border-brand-border bg-brand-surface/80"
            >
              {scaleOptions.map((option) => {
                const active = activeScale === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    tabIndex={active ? 0 : -1}
                    disabled={isProcessing}
                    onClick={() => onSettingsChange({ ...settings, scale: option.value })}
                    onKeyDown={(e) =>
                      handleRadioKeyDown(e, scaleValues, activeScale, (scale) =>
                        onSettingsChange({ ...settings, scale })
                      )
                    }
                    className={`relative z-10 h-9 px-2 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "text-brand-accentText"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId={reduced ? undefined : "resolution-scale-pill"}
                        transition={{ type: "spring", stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-brand-accent/15 border border-brand-accent -z-10"
                      />
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible Advanced: Filename Template */}
          <div className="border-t border-brand-border pt-3">
            <button
              type="button"
              aria-expanded={advancedOpen}
              aria-controls="advanced-filename-section"
              onClick={() => setAdvancedOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span>Advanced · Filename template</span>
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${
                  advancedOpen ? "rotate-180 text-brand-accentText" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence initial={false}>
              {advancedOpen && (
                <motion.div
                  id="advanced-filename-section"
                  initial={{ height: 0, opacity: reduced ? 1 : 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: reduced ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="filename-template" className="text-xs text-muted-foreground">
                        Template pattern
                      </label>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          onSettingsChange({
                            ...settings,
                            filenameTemplate: DEFAULT_FILENAME_TEMPLATE,
                          })
                        }
                        className="text-xs font-semibold text-brand-accentText hover:underline disabled:opacity-50"
                      >
                        Reset default
                      </button>
                    </div>

                    <input
                      ref={templateInputRef}
                      id="filename-template"
                      type="text"
                      disabled={isProcessing}
                      value={settings.filenameTemplate ?? DEFAULT_FILENAME_TEMPLATE}
                      onChange={(event) =>
                        onSettingsChange({ ...settings, filenameTemplate: event.target.value })
                      }
                      placeholder={DEFAULT_FILENAME_TEMPLATE}
                      className="h-9 w-full rounded-xl border border-brand-border bg-brand-surface/80 px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-brand-accent focus:outline-none"
                    />

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground mr-1">Insert:</span>
                      {TEMPLATE_TOKENS.map((token) => (
                        <button
                          key={token}
                          type="button"
                          disabled={isProcessing}
                          onClick={() => insertTokenAtCursor(token)}
                          className="px-2 py-0.5 rounded-md border border-brand-border bg-brand-card hover:border-brand-accent/50 hover:text-brand-accentText text-[11px] font-mono text-foreground transition-colors disabled:opacity-50"
                        >
                          {token}
                        </button>
                      ))}
                    </div>

                    <p
                      className="text-xs text-muted-foreground font-mono truncate"
                      title={filenamePreview}
                    >
                      Preview: {filenamePreview}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Safety Limit Warning */}
      {(overLimit || overOutputBudget) && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-500/40 bg-amber-500/10 text-foreground p-3.5 flex items-start gap-2.5"
        >
          <AlertTriangle className="size-5 shrink-0 text-amber-500 mt-0.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm leading-relaxed">
            {overLimit
              ? `This setup would create ${estimatedCount.toLocaleString()} frames, above the ${MAX_EXTRACTED_FRAMES}-frame limit. Increase the interval or lower FPS.`
              : `Estimated image data is ${formatBytes(estimatedBytes)}, above the ${formatBytes(MAX_ESTIMATED_OUTPUT_BYTES)} safety limit. Use fewer frames or a smaller video.`}
          </p>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted-foreground font-mono">
          Output: {estimatedCount.toLocaleString()} stills · {scaledDims.width} ×{" "}
          {scaledDims.height} · Processed locally
        </p>

        <button
          type="button"
          disabled={isProcessing || blockedBySafetyLimit}
          onClick={onStartExtraction}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-7 rounded-full bg-gradient-to-r from-[#ff6a2b] to-[#ff8547] text-[#0b0b0d] font-semibold text-sm shadow-accent hover:shadow-accent-strong hover:brightness-105 transition-all disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-4" aria-hidden="true" />
          )}
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
