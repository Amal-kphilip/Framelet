"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Download, CheckSquare, Square, RefreshCw, ZoomIn, Clock, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
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

type FilterMode = "all" | "selected" | "unselected";
type SortMode = "time-asc" | "time-desc" | "size-desc";
const PAGE_SIZE = 48;

export const FrameGallery: React.FC<FrameGalleryProps> = ({
  frames,
  videoName,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onPreviewFrame,
}) => {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("time-asc");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const selectedCount = frames.filter((frame) => frame.selected).length;
  const isAllSelected = selectedCount === frames.length && frames.length > 0;

  const filteredFrames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = frames.filter((frame) => {
      if (filter === "selected" && !frame.selected) return false;
      if (filter === "unselected" && frame.selected) return false;
      if (normalizedQuery && !frame.formattedTime.toLowerCase().includes(normalizedQuery) && !String(frame.index).includes(normalizedQuery)) return false;
      return true;
    });
    next.sort((a, b) => {
      if (sort === "time-desc") return b.timestamp - a.timestamp || b.index - a.index;
      if (sort === "size-desc") return b.sizeBytes - a.sizeBytes || a.timestamp - b.timestamp;
      return a.timestamp - b.timestamp || a.index - b.index;
    });
    return next;
  }, [filter, frames, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filteredFrames.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const visibleFrames = filteredFrames.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const firstVisible = filteredFrames.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(safePage * PAGE_SIZE, filteredFrames.length);


  return (
    <section aria-labelledby="frame-gallery-heading" className="w-full space-y-5">
      <div className="p-5 rounded-3xl glass-panel border border-white/15 backdrop-blur-2xl shadow-glass space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/[0.07] border border-white/15 text-white shadow-inner">
              <CheckSquare className="w-5 h-5 text-sky-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id="frame-gallery-heading" className="text-base font-bold text-white tracking-tight">Extracted Frames</h2>
              <p className="text-xs text-white/55"><span className="text-sky-400 font-semibold">{selectedCount}</span> of {frames.length} selected · {filteredFrames.length} match current filters</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <button type="button" onClick={isAllSelected ? onDeselectAll : onSelectAll} className="min-h-10 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.08] hover:bg-white/[0.15] text-white/90 border border-white/15 hover:border-white/30 transition-colors flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
              {isAllSelected ? <Square className="w-3.5 h-3.5 text-white/70" aria-hidden="true" /> : <CheckSquare className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />}
              {isAllSelected ? "Deselect All" : "Select All"}
            </button>
            <button type="button" onClick={onInvertSelection} className="min-h-10 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.05] hover:bg-white/[0.1] text-white/75 hover:text-white border border-white/10 hover:border-white/20 transition-colors flex items-center gap-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
              <RefreshCw className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" /> Invert
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" aria-hidden="true" />
            <label htmlFor="frame-search" className="sr-only">Filter by frame number or timestamp</label>
            <input id="frame-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="Find frame or timestamp" className="w-full min-h-10 rounded-xl border border-white/10 bg-black/20 pl-9 pr-3 text-xs text-white placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400" />
          </div>
          <div className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" aria-hidden="true" />
            <label htmlFor="frame-filter" className="sr-only">Filter frame selection</label>
            <select id="frame-filter" value={filter} onChange={(event) => { setFilter(event.target.value as FilterMode); setCurrentPage(1); }} className="w-full min-h-10 appearance-none rounded-xl border border-white/10 bg-[#17171d] pl-9 pr-3 text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
              <option value="all">All frames</option>
              <option value="selected">Selected only</option>
              <option value="unselected">Unselected only</option>
            </select>
          </div>
          <div>
            <label htmlFor="frame-sort" className="sr-only">Sort frames</label>
            <select id="frame-sort" value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setCurrentPage(1); }} className="w-full min-h-10 rounded-xl border border-white/10 bg-[#17171d] px-3 text-xs text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
              <option value="time-asc">Oldest timestamp first</option>
              <option value="time-desc">Newest timestamp first</option>
              <option value="size-desc">Largest file first</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>{filteredFrames.length ? `Showing ${firstVisible}–${lastVisible} of ${filteredFrames.length}` : "No frames match these filters"}</span>
          <span>Choose a thumbnail to select it · Preview and save actions are always available</span>
        </div>
      </div>

      {visibleFrames.length > 0 ? (
        <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 items-start">
          <AnimatePresence mode="popLayout">
            {visibleFrames.map((frame) => (
              <motion.article
                key={frame.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className={`group relative rounded-2xl overflow-hidden transition-colors ${frame.selected ? "glass-card-selected ring-2 ring-sky-400/80" : "glass-panel-interactive border border-white/10 hover:border-white/30"}`}
              >
                <div className="relative w-full overflow-hidden bg-black/50 flex items-center justify-center" style={{ aspectRatio: `${frame.width} / ${frame.height}` }}>
                  <Image src={frame.dataUrl} alt={`Video frame ${frame.index} at ${frame.formattedTime}`} width={frame.width} height={frame.height} unoptimized sizes="(max-width: 640px) 48vw, (max-width: 1024px) 24vw, 16vw" className="w-full h-full object-contain" loading="lazy" />
                  <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />
                  <button type="button" aria-label={`${frame.selected ? "Deselect" : "Select"} frame ${frame.index} at ${frame.formattedTime}`} aria-pressed={frame.selected} onClick={() => onToggleSelect(frame.id)} className="absolute inset-0 z-[5] bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sky-400" />

                  <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${frame.selected ? "bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.6)]" : "bg-black/60 border border-white/40 text-transparent"}`}>
                      <Check className={`w-3.5 h-3.5 stroke-[3] ${frame.selected ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/85 pointer-events-none">#{frame.index}</div>

                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between gap-1 z-20">
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono font-medium text-white/90 bg-black/65 backdrop-blur-sm px-1.5 sm:px-2 py-1 rounded-md border border-white/10 pointer-events-none">
                      <Clock className="w-3 h-3 text-sky-400" aria-hidden="true" />{frame.formattedTime}
                    </span>
                    <div className="flex items-center gap-1">
                      <button type="button" aria-label={`Preview frame ${frame.index}`} title="Preview frame" onClick={() => onPreviewFrame(frame)} className="min-w-8 min-h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/35 backdrop-blur-md text-white transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
                        <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      <button type="button" aria-label={`Download frame ${frame.index}`} title="Download frame" onClick={() => downloadSingleFrame(frame, videoName)} className="min-w-8 min-h-8 flex items-center justify-center rounded-lg bg-sky-500/90 hover:bg-sky-500 text-white transition-colors shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-2.5 py-2 flex items-center justify-between gap-2 border-t border-white/10 bg-black/10">
                  <span className="text-[10px] text-white/50 font-mono truncate">{frame.width}×{frame.height}</span>
                  <span className="text-[10px] text-white/50 font-mono shrink-0">{(frame.sizeBytes / 1024).toFixed(frame.sizeBytes < 1024 * 100 ? 1 : 0)} KB</span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <Search className="w-8 h-8 text-white/35 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-white/75">No matching frames</p>
          <p className="text-xs text-white/45 mt-1">Change the timestamp search or selection filter to see results.</p>
          <button type="button" onClick={() => { setQuery(""); setFilter("all"); setCurrentPage(1); }} className="mt-4 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs text-white/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">Clear filters</button>
        </div>
      )}

      {pageCount > 1 && <nav aria-label="Frame gallery pages" className="flex items-center justify-center gap-3 pt-1">
        <button type="button" onClick={() => setCurrentPage(Math.max(1, safePage - 1))} disabled={safePage === 1} className="min-h-10 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"><ChevronLeft className="w-4 h-4" aria-hidden="true" />Previous</button>
        <span aria-live="polite" className="text-xs text-white/60">Page {safePage} of {pageCount}</span>
        <button type="button" onClick={() => setCurrentPage(Math.min(pageCount, safePage + 1))} disabled={safePage === pageCount} className="min-h-10 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/80 hover:bg-white/10 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">Next<ChevronRight className="w-4 h-4" aria-hidden="true" /></button>
      </nav>}
    </section>
  );
};
