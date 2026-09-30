"use client";

import React from "react";
import { Film, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  onReset?: () => void;
  hasVideo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasVideo }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-black/30 border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={onReset}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src="/icon.png"
            alt="Framelet Icon"
            className="h-8 sm:h-9 w-auto object-contain select-none mix-blend-screen group-hover:scale-105 transition-all duration-300"
            style={{
              filter: "invert(1) sepia(1) saturate(10000%) hue-rotate(340deg) brightness(1.1) drop-shadow(0 0 10px rgba(255, 45, 85, 0.6))",
            }}
          />

          <img
            src="/logo.png"
            alt="Framelet"
            className="h-10 sm:h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 select-none mix-blend-screen dark:mix-blend-screen light:invert light:mix-blend-multiply"
          />
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          {/* Privacy & Zero-lag Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-white/70 shadow-sm backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Client-Side</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Lag</span>
          </div>

          {hasVideo && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onReset}
              className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white/90 border border-white/15 hover:border-white/30 transition-all shadow-sm"
            >
              New Video
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};
