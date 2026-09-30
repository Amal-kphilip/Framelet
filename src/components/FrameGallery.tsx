"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Eye, Download, CheckSquare, Square, RefreshCw, ZoomIn, Clock } from "lucide-react";
import { ExtractedFrame } from "@/types";
import { downloadSingleFrame } from "@/lib/zipExporter";

interface FrameGalleryProps {
  frames: ExtractedFrame[];
  videoName: string;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onPreviewFrame: (frame: ExtractedFrame) => void;
}

export const FrameGallery: React.FC<FrameGalleryProps> = ({
  frames,
  videoName,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onPreviewFrame,
}) => {
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null);

  const selectedCount = frames.filter((f) => f.selected).length;
  const isAllSelected = selectedCount === frames.length && frames.length > 0;

  return (
    <div className="w-full space-y-6">
      {/* Gallery Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-white/15 backdrop-blur-2xl shadow-glass">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/[0.07] border border-white/15 text-white shadow-inner">
            <CheckSquare className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Extracted Frames Gallery
            </h3>
            <p className="text-xs text-white/50">
              <span className="text-sky-400 font-semibold">{selectedCount}</span> of {frames.length} frames selected for download
            </p>
          </div>
        </div>

        {/* Selection Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.08] hover:bg-white/[0.15] text-white/90 border border-white/15 hover:border-white/30 transition-all flex items-center gap-1.5 active:scale-95"
          >
            {isAllSelected ? (
              <>
                <Square className="w-3.5 h-3.5 text-white/70" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Select All</span>
              </>
            )}
          </button>

          <button
            onClick={onInvertSelection}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Invert</span>
          </button>
        </div>
      </div>

      {/* Frames Grid */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5"
      >
        <AnimatePresence>
          {frames.map((frame, index) => {
            const isHovered = hoveredFrameId === frame.id;
            return (
              <motion.div
                key={frame.id}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.4) }}
                onMouseEnter={() => setHoveredFrameId(frame.id)}
                onMouseLeave={() => setHoveredFrameId(null)}
                onClick={() => onToggleSelect(frame.id)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  frame.selected
                    ? "glass-card-selected ring-2 ring-sky-400/80 scale-[1.01]"
                    : "glass-panel-interactive border border-white/10 hover:border-white/30"
                }`}
              >
                {/* Image Container with Aspect Ratio */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <img
                    src={frame.dataUrl}
                    alt={`Frame at ${frame.formattedTime}`}
                    className={`w-full h-full object-cover transition-transform duration-500 ease-out ${
                      isHovered ? "scale-105" : "scale-100"
                    }`}
                    loading="lazy"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Checkmark Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                        frame.selected
                          ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-100"
                          : "bg-black/50 border border-white/30 text-transparent hover:border-white/60 scale-90"
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${frame.selected ? "opacity-100" : "opacity-0"}`} />
                    </div>
                  </div>

                  {/* Top Left Frame Index */}
                  <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/80">
                    #{frame.index}
                  </div>

                  {/* Bottom Bar: Timestamp and Quick Actions */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between z-10">
                    <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-white/90 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
                      <Clock className="w-3 h-3 text-sky-400" />
                      {frame.formattedTime}
                    </span>

                    {/* Quick Hover Actions */}
                    <div 
                      className={`flex items-center gap-1 transition-opacity duration-200 ${
                        isHovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Zoom Button */}
                      <button
                        title="Preview Frame"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewFrame(frame);
                        }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 backdrop-blur-md text-white transition-all shadow-sm"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>

                      {/* Download Single Frame */}
                      <button
                        title="Download Frame"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSingleFrame(frame, videoName);
                        }}
                        className="p-1.5 rounded-lg bg-sky-500/80 hover:bg-sky-500 backdrop-blur-md text-white transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
