"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Cpu, Clock } from "lucide-react";

interface LiquidProgressBarProps {
  progress: number; // 0 to 100
  currentFrame?: number;
  totalFrames?: number;
  statusText?: string;
}

export const LiquidProgressBar: React.FC<LiquidProgressBarProps> = ({
  progress,
  currentFrame = 0,
  totalFrames = 0,
  statusText = "Extracting video frames...",
}) => {
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full rounded-3xl p-6 sm:p-8 glass-panel border border-white/20 shadow-apple-card relative overflow-hidden"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center animate-pulse">
              <Cpu className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span>{statusText}</span>
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              </h4>
              {totalFrames > 0 && (
                <p className="text-xs text-white/50 font-mono">
                  Processing frame {currentFrame} of {totalFrames}
                </p>
              )}
            </div>
          </div>

          {/* Big Percentage Display */}
          <div className="text-right">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">
              {roundedProgress}%
            </span>
          </div>
        </div>

        {/* Liquid Glass Progress Track */}
        <div className="relative h-4 w-full rounded-full bg-black/40 border border-white/15 p-0.5 overflow-hidden backdrop-blur-md shadow-inner">
          {/* Animated Liquid Fill */}
          <motion.div
            className="h-full rounded-full relative overflow-hidden bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(56,189,248,0.6)]"
            initial={{ width: "0%" }}
            animate={{ width: `${roundedProgress}%` }}
            transition={{ ease: "easeOut", duration: 0.3 }}
          >
            {/* Shimmer Light Reflection Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />

            {/* Glowing Tip */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_#ffffff]" />
          </motion.div>
        </div>

        {/* Progress Hint */}
        <div className="flex items-center justify-between text-xs text-white/40 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400/70" /> Client-side high speed capture
          </span>
          <span>Zero network latency</span>
        </div>
      </div>
    </motion.div>
  );
};
