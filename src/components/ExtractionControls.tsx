"use client";

import React from "react";
import { Sliders, Zap, Sparkles, Layers, Image as ImageIcon, Gauge } from "lucide-react";
import { motion } from "framer-motion";
import { ExtractionSettings, VideoMetadata } from "@/types";

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
  // Calculate estimated frames based on interval
  const calculatedInterval = settings.mode === 'fps' ? 1 / settings.fps : settings.interval;
  const estimatedCount = Math.max(1, Math.floor(metadata.duration / calculatedInterval) + 1);

  const presets = [
    { label: "Ultra Dense (0.2s)", interval: 0.2, fps: 5 },
    { label: "High Detail (0.5s)", interval: 0.5, fps: 2 },
    { label: "Standard (1.0s)", interval: 1.0, fps: 1 },
    { label: "Sparse (2.0s)", interval: 2.0, fps: 0.5 },
    { label: "Key Milestones (5.0s)", interval: 5.0, fps: 0.2 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 shadow-apple-card relative overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Extraction Tuning
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Frame Capture Rate & Quality
          </h2>
          <p className="text-xs text-white/60">
            Configure how frequently frames are extracted from your {metadata.formattedDuration} video.
          </p>
        </div>

        {/* Live Estimated Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md self-start lg:self-auto">
          <Layers className="w-5 h-5 text-purple-400" />
          <div>
            <span className="text-[11px] text-white/50 uppercase tracking-wider block">Estimated Output</span>
            <span className="text-base font-bold text-white font-mono">
              ~{estimatedCount} <span className="text-xs font-normal text-white/70">frames ({metadata.width}×{metadata.height})</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {/* Interval & FPS Slider Control */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>Extraction Interval</span>
            </label>
            <span className="text-sm font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
              Every {settings.interval.toFixed(2)}s ({ (1 / settings.interval).toFixed(1) } FPS)
            </span>
          </div>

          <div className="relative pt-2">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={settings.interval}
              disabled={isProcessing}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSettingsChange({
                  ...settings,
                  interval: val,
                  fps: 1 / val,
                });
              }}
              className="w-full cursor-pointer accent-sky-400 disabled:opacity-50"
            />
            <div className="flex justify-between text-[11px] text-white/40 mt-2 font-mono">
              <span>0.1s (Dense 10fps)</span>
              <span>1.0s (Standard)</span>
              <span>5.0s (Overview)</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-2">
            <span className="text-[11px] text-white/50 block mb-2 font-medium">Quick Presets</span>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => {
                const isActive = Math.abs(settings.interval - p.interval) < 0.05;
                return (
                  <button
                    key={p.label}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      onSettingsChange({
                        ...settings,
                        interval: p.interval,
                        fps: p.fps,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)] font-semibold"
                        : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border border-white/10 hover:border-white/20"
                    } disabled:opacity-50`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Output Format & Quality Control */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              <span>Image Format</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["image/jpeg", "image/png", "image/webp"] as const).map((fmt) => {
                const isSelected = settings.format === fmt;
                const label = fmt === "image/jpeg" ? "JPEG (Fast)" : fmt === "image/png" ? "PNG (Lossless)" : "WebP (Small)";
                return (
                  <button
                    key={fmt}
                    type="button"
                    disabled={isProcessing}
                    onClick={() => onSettingsChange({ ...settings, format: fmt })}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                      isSelected
                        ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        : "bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border border-white/10"
                    } disabled:opacity-50`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {settings.format !== "image/png" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-white/70">Compression Quality</label>
                <span className="text-xs font-mono font-semibold text-purple-300">
                  {Math.round(settings.quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={settings.quality}
                disabled={isProcessing}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    quality: parseFloat(e.target.value),
                  })
                }
                className="w-full cursor-pointer accent-purple-400 disabled:opacity-50"
              />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              disabled={isProcessing}
              onClick={onStartExtraction}
              className="w-full py-3.5 px-6 rounded-2xl liquid-gradient-btn text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 fill-white/20" />
              <span>{isProcessing ? "Extracting Frames..." : `Extract ~${estimatedCount} Frames Now`}</span>
              <Zap className="w-4 h-4 fill-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
