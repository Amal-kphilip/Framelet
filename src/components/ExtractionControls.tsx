"use client";

import React from "react";
import { Sliders, Zap, Sparkles, Layers, Image as ImageIcon, Gauge, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { ExtractionSettings, VideoMetadata } from "@/types";
import { buildFrameTimestamps, estimateOutputBytes, formatBytes, MAX_ESTIMATED_OUTPUT_BYTES, MAX_EXTRACTED_FRAMES } from "@/lib/videoUtils";

interface ExtractionControlsProps {
  metadata: VideoMetadata;
  settings: ExtractionSettings;
  onSettingsChange: (settings: ExtractionSettings) => void;
  onStartExtraction: () => void;
  isProcessing: boolean;
}

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

  const presets = [
    { label: "Dense · 0.2s", interval: 0.2, fps: 5 },
    { label: "Detail · 0.5s", interval: 0.5, fps: 2 },
    { label: "Standard · 1s", interval: 1, fps: 1 },
    { label: "Sparse · 2s", interval: 2, fps: 0.5 },
    { label: "Milestones · 5s", interval: 5, fps: 0.2 },
  ];

  return (
    <motion.section
      aria-labelledby="extraction-controls-heading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full rounded-3xl p-5 sm:p-8 glass-panel border border-white/15 shadow-apple-card relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Extraction Settings</span>
          </div>
          <h2 id="extraction-controls-heading" className="text-xl font-bold text-white tracking-tight">Frame Capture Rate & Quality</h2>
          <p className="text-xs text-white/60 mt-1">Configure frames for this {metadata.formattedDuration} video. Output dimensions stay at {metadata.width} × {metadata.height}.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:min-w-[340px]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10">
            <Layers className="w-5 h-5 text-purple-400 shrink-0" aria-hidden="true" />
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block">Estimated Frames</span>
              <span className="text-lg font-bold text-white font-mono">{estimatedCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10">
            <ImageIcon className="w-5 h-5 text-sky-400 shrink-0" aria-hidden="true" />
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block">Approx. Image Data</span>
              <span className="text-base font-bold text-white font-mono">{formatBytes(estimatedBytes)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-white/90 flex items-center gap-2"><Gauge className="w-4 h-4 text-sky-400" aria-hidden="true" />Capture Rate</span>
            <div role="group" aria-label="Capture rate mode" className="grid grid-cols-2 gap-2">
              <button type="button" disabled={isProcessing} aria-pressed={settings.mode !== "fps"} onClick={() => onSettingsChange({ ...settings, mode: "interval", interval: settings.interval || 1, fps: 1 / (settings.interval || 1) })} className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${settings.mode !== "fps" ? "bg-sky-500/20 border-sky-400/50 text-sky-200" : "bg-white/[0.04] border-white/10 text-white/65 hover:text-white"}`}>Interval</button>
              <button type="button" disabled={isProcessing} aria-pressed={settings.mode === "fps"} onClick={() => onSettingsChange({ ...settings, mode: "fps", fps: settings.fps || 1, interval: 1 / (settings.fps || 1) })} className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${settings.mode === "fps" ? "bg-sky-500/20 border-sky-400/50 text-sky-200" : "bg-white/[0.04] border-white/10 text-white/65 hover:text-white"}`}>Frames per second</button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center gap-3 mb-2">
              <label htmlFor="capture-rate" className="text-sm font-semibold text-white/90">{settings.mode === "fps" ? "Frames per second" : "Seconds between frames"}</label>
              <span className="text-sm font-mono font-bold text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20 whitespace-nowrap">
                {settings.mode === "fps" ? `${settings.fps.toFixed(1)} FPS` : `Every ${settings.interval.toFixed(2)}s`}
              </span>
            </div>
            <input
              id="capture-rate"
              type="range"
              min={settings.mode === "fps" ? "0.1" : "0.1"}
              max={settings.mode === "fps" ? "10" : "5"}
              step="0.1"
              value={sliderValue}
              disabled={isProcessing}
              aria-valuetext={settings.mode === "fps" ? `${settings.fps.toFixed(1)} frames per second` : `${settings.interval.toFixed(1)} seconds between frames`}
              onChange={(event) => {
                const value = Number.parseFloat(event.target.value);
                onSettingsChange(settings.mode === "fps"
                  ? { ...settings, mode: "fps", fps: value, interval: 1 / value }
                  : { ...settings, mode: "interval", interval: value, fps: 1 / value });
              }}
              className="w-full cursor-pointer accent-sky-400 disabled:opacity-50"
            />
            <div className="flex justify-between text-[11px] text-white/40 mt-2 font-mono">
              {settings.mode === "fps" ? <><span>0.1 FPS</span><span>10 FPS</span></> : <><span>0.1s · Dense</span><span>5s · Overview</span></>}
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-white/50 block mb-2 font-medium">Quick Presets (switch to interval)</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => {
                const active = settings.mode !== "fps" && Math.abs(settings.interval - preset.interval) < 0.05;
                return <button key={preset.label} type="button" disabled={isProcessing} onClick={() => onSettingsChange({ ...settings, mode: "interval", interval: preset.interval, fps: preset.fps })} aria-pressed={active} className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${active ? "bg-sky-500 text-white" : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border border-white/10"} disabled:opacity-50`}>{preset.label}</button>;
              })}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <span className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4 text-purple-400" aria-hidden="true" />Output Format</span>
            <div role="group" aria-label="Output image format" className="grid grid-cols-3 gap-2">
              {(["image/jpeg", "image/png", "image/webp"] as const).map((format) => {
                const selected = settings.format === format;
                const label = format === "image/jpeg" ? "JPEG" : format === "image/png" ? "PNG" : "WebP";
                const description = format === "image/jpeg" ? "Smaller, lossy" : format === "image/png" ? "Lossless" : "Usually smaller";
                return <button key={format} type="button" disabled={isProcessing} aria-pressed={selected} onClick={() => onSettingsChange({ ...settings, format })} className={`px-2 py-3 rounded-xl text-xs font-semibold text-center transition-colors border focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${selected ? "bg-purple-600/80 text-white border-purple-300/50" : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border-white/10"} disabled:opacity-50`}><span className="block">{label}</span><span className="block mt-1 text-[10px] font-normal opacity-70">{description}</span></button>;
              })}
            </div>
          </div>

          {settings.format !== "image/png" && <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="image-quality" className="text-xs font-medium text-white/70">Image Quality</label>
              <span className="text-xs font-mono font-semibold text-purple-300">{Math.round(settings.quality * 100)}%</span>
            </div>
            <input id="image-quality" type="range" min="0.5" max="1.0" step="0.05" value={settings.quality} disabled={isProcessing} onChange={(event) => onSettingsChange({ ...settings, quality: Number.parseFloat(event.target.value) })} className="w-full cursor-pointer accent-purple-400 disabled:opacity-50" />
            <p className="text-[11px] text-white/45 mt-1">Quality affects lossy formats only. PNG output is lossless.</p>
          </div>}

          {overLimit && <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/[0.08] p-3 text-xs text-amber-100"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" /><span>{overLimit ? `This setup would create ${estimatedCount.toLocaleString()} frames, above the ${MAX_EXTRACTED_FRAMES}-frame limit. Increase the interval or lower FPS.` : `The rough output estimate is ${formatBytes(estimatedBytes)}, above the 512 MiB guardrail. Use fewer frames or a smaller video resolution.`}</span></div>}

          <div className="pt-1">
            <motion.button
              whileHover={{ scale: isProcessing || blockedBySafetyLimit ? 1 : 1.01 }}
              whileTap={{ scale: isProcessing || blockedBySafetyLimit ? 1 : 0.99 }}
              disabled={isProcessing || blockedBySafetyLimit}
              onClick={onStartExtraction}
              className="w-full py-3.5 px-6 rounded-2xl liquid-gradient-btn text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <Sparkles className="w-4 h-4 fill-white/20" aria-hidden="true" />
              <span>{isProcessing ? "Extracting Frames…" : overLimit ? `Reduce below ${MAX_EXTRACTED_FRAMES} frames` : overOutputBudget ? "Reduce estimated output size" : `Extract ${estimatedCount} Frames`}</span>
              <Zap className="w-4 h-4 fill-white" aria-hidden="true" />
            </motion.button>
            <p title="Rough estimate only; encoded size depends on image complexity and quality" className="text-[10px] text-white/40 mt-2 text-center">Approximate image data only; actual size depends on frame content and format.</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
