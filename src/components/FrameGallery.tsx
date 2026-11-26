"use client";

import React, { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
} from "lucide-react";
import { ExtractedFrame } from "@/types";
import { downloadSingleFrame } from "@/lib/zipExporter";

interface FrameGalleryProps {
  frames: ExtractedFrame[];
  videoName: string;
  filenameTemplate?: string;
  onToggleSelect: (id: string) => void;
  onSelectRange: (ids: string[], selected: boolean) => void;
  onSelectEveryNth: (n: number) => void;
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
  filenameTemplate,
  onToggleSelect,
  onSelectRange,
  onSelectEveryNth,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onPreviewFrame,
}) => {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("time-asc");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const lastTapRef = useRef<{ id: string; time: number }>({ id: "", time: 0 });
  const lastAnchorIdRef = useRef<string | null>(null);

  const selectedCount = frames.filter((frame) => frame.selected).length;
  const isAllSelected = selectedCount === frames.length && frames.length > 0;

  const filteredFrames = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const next = frames.filter((frame) => {
      if (filter === "selected" && !frame.selected) return false;
      if (filter === "unselected" && frame.selected) return false;
      if (
        normalizedQuery &&
        !frame.formattedTime.toLowerCase().includes(normalizedQuery) &&
        !String(frame.index).includes(normalizedQuery)
      ) {
        return false;
      }
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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, frame: ExtractedFrame) => {
    const now = e.timeStamp;
    const lastTap = lastTapRef.current;
    if (!e.shiftKey && lastTap.id === frame.id && now - lastTap.time < 350) {
      lastTapRef.current = { id: "", time: 0 };
      onPreviewFrame(frame);
      return;
    }
    lastTapRef.current = { id: frame.id, time: now };

    if (e.shiftKey && lastAnchorIdRef.current) {
      const anchorIndex = filteredFrames.findIndex((f) => f.id === lastAnchorIdRef.current);
      const targetIndex = filteredFrames.findIndex((f) => f.id === frame.id);
      if (anchorIndex !== -1 && targetIndex !== -1) {
        const start = Math.min(anchorIndex, targetIndex);
        const end = Math.max(anchorIndex, targetIndex);
        const rangeIds = filteredFrames.slice(start, end + 1).map((f) => f.id);
        onSelectRange(rangeIds, !frame.selected);
        lastAnchorIdRef.current = frame.id;
        return;
      }
    }

    lastAnchorIdRef.current = frame.id;
    onToggleSelect(frame.id);
  };

  return (
    <section aria-labelledby="frame-gallery-heading" className="w-full flex flex-col gap-5">
      {/* Glass Toolbar */}
      <div className="glass rounded-3xl border border-brand-border p-4 sm:p-6 flex flex-col gap-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2
              id="frame-gallery-heading"
              className="font-display font-700 text-base sm:text-lg text-foreground"
            >
              Extracted frames
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {selectedCount} of {frames.length} selected · {filteredFrames.length} shown
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              className="h-9 px-3 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              {isAllSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
              <span>{isAllSelected ? "Deselect all" : "Select all"}</span>
            </button>
            <button
              type="button"
              onClick={onInvertSelection}
              className="h-9 px-3 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="size-4" />
              <span>Invert</span>
            </button>

            <div
              role="group"
              aria-label="Select every Nth frame"
              className="inline-flex items-center rounded-xl border border-brand-border overflow-hidden bg-brand-card/70"
            >
              <span className="px-2.5 text-xs text-muted-foreground font-semibold whitespace-nowrap">
                Every
              </span>
              {[2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onSelectEveryNth(n)}
                  title={`Select every ${n} frames`}
                  aria-label={`Select every ${n} frames`}
                  className="h-9 px-2.5 text-xs font-mono font-semibold border-l border-brand-border hover:bg-brand-accent/15 hover:text-brand-accentText text-foreground transition-colors"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search, Filter, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <label htmlFor="frame-search" className="sr-only">
              Filter by frame number or timestamp
            </label>
            <input
              id="frame-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search frame or time"
              className="w-full h-10 rounded-xl border border-brand-border bg-brand-surface/80 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div className="relative">
            <label htmlFor="frame-filter" className="sr-only">
              Filter frame selection
            </label>
            <select
              id="frame-filter"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as FilterMode);
                setCurrentPage(1);
              }}
              className="appearance-none w-full h-10 rounded-xl border border-brand-border bg-brand-surface/80 hover:border-brand-accent/40 pl-3 pr-9 text-xs sm:text-sm font-medium text-foreground cursor-pointer transition-colors focus:border-brand-accent focus:outline-none"
            >
              <option value="all">All frames</option>
              <option value="selected">Selected only</option>
              <option value="unselected">Unselected only</option>
            </select>
            <ChevronDown
              className="size-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
          </div>

          <div className="relative">
            <label htmlFor="frame-sort" className="sr-only">
              Sort frames
            </label>
            <select
              id="frame-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortMode);
                setCurrentPage(1);
              }}
              className="appearance-none w-full h-10 rounded-xl border border-brand-border bg-brand-surface/80 hover:border-brand-accent/40 pl-3 pr-9 text-xs sm:text-sm font-medium text-foreground cursor-pointer transition-colors focus:border-brand-accent focus:outline-none"
            >
              <option value="time-asc">Oldest timestamp first</option>
              <option value="time-desc">Newest timestamp first</option>
              <option value="size-desc">Largest file first</option>
            </select>
            <ChevronDown
              className="size-4 text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredFrames.length
              ? `Showing ${firstVisible}–${lastVisible} of ${filteredFrames.length}`
              : "No frames match these filters"}
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Click to select · Double-click to expand
          </span>
        </div>
      </div>

      {/* Frame Grid */}
      {visibleFrames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 items-start">
          {visibleFrames.map((frame) => (
            <article
              key={frame.id}
              className={`group relative glass rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
                frame.selected
                  ? "border-brand-accent ring-1 ring-brand-accent shadow-accent"
                  : "border-brand-border opacity-75 hover:opacity-100"
              }`}
            >
              <div
                className="relative w-full overflow-hidden bg-brand-surface flex items-center justify-center cursor-pointer"
                style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
                onClick={(e) => handleCardClick(e, frame)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onPreviewFrame(frame);
                }}
                role="button"
                tabIndex={0}
                aria-label={`${frame.selected ? "Deselect" : "Select"} frame ${frame.index} at ${frame.formattedTime} (double-click to preview)`}
                aria-pressed={frame.selected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleSelect(frame.id);
                  }
                }}
              >
                <Image
                  src={frame.dataUrl}
                  alt={`Video frame ${frame.index} at ${frame.formattedTime}`}
                  width={frame.width}
                  height={frame.height}
                  unoptimized
                  sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
                  className="w-full h-full object-contain select-none"
                  loading="lazy"
                />

                {/* Frame Index Badge */}
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md border border-brand-border bg-brand-surface/85 backdrop-blur-sm text-foreground text-xs font-mono font-semibold pointer-events-none">
                  #{frame.index}
                </div>

                {/* Selection Checkbox Badge */}
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                  <span
                    className={`size-6 rounded-lg border flex items-center justify-center transition-colors ${
                      frame.selected
                        ? "border-brand-accent bg-brand-accent text-[#0b0b0d]"
                        : "border-brand-border bg-brand-surface/80 text-transparent"
                    }`}
                  >
                    <Check className="size-4 stroke-[2.5]" aria-hidden="true" />
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-2.5 flex flex-col gap-1 border-t border-brand-border bg-brand-card/60">
                <div className="flex items-center justify-between gap-1.5 min-w-0">
                  <span className="text-xs font-mono font-semibold text-foreground leading-tight">
                    {frame.formattedTime}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Preview frame ${frame.index}`}
                      title="Expand preview"
                      onClick={() => onPreviewFrame(frame)}
                      className="size-7 sm:size-8 inline-flex items-center justify-center rounded-lg border border-brand-border bg-brand-surface/80 hover:border-brand-accent/40 text-foreground transition-colors"
                    >
                      <ZoomIn className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Download frame ${frame.index}`}
                      title="Download frame"
                      onClick={() => downloadSingleFrame(frame, videoName, filenameTemplate)}
                      className="size-7 sm:size-8 inline-flex items-center justify-center rounded-lg bg-brand-accent text-[#0b0b0d] hover:brightness-105 transition-all"
                    >
                      <Download className="size-3.5" />
                    </button>
                  </div>
                </div>

                <span className="text-xs text-muted-foreground font-mono block leading-tight break-words">
                  {frame.width}×{frame.height} ·{" "}
                  {(frame.sizeBytes / 1024).toFixed(frame.sizeBytes < 1024 * 100 ? 1 : 0)} KB
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl border border-brand-border p-8 flex flex-col items-center text-center gap-2">
          <p className="text-sm font-semibold text-foreground">No matching frames</p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Change the timestamp search or selection filter to see results.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
              setCurrentPage(1);
            }}
            className="mt-2 h-9 px-4 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <nav
          aria-label="Frame gallery pages"
          className="flex items-center justify-center gap-3 pt-2"
        >
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="h-9 px-3 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </button>
          <span className="text-xs sm:text-sm font-semibold font-mono text-foreground">
            Page {safePage} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(pageCount, safePage + 1))}
            disabled={safePage === pageCount}
            className="h-9 px-3 rounded-xl border border-brand-border bg-brand-card/70 hover:border-brand-accent/40 text-xs font-semibold text-foreground inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </section>
  );
};

export const FrameGallerySkeleton: React.FC<{
  width?: number;
  height?: number;
  count?: number;
}> = ({ width = 16, height = 9, count = 8 }) => {
  return (
    <section
      aria-label="Extracting frames"
      aria-busy="true"
      className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass rounded-2xl border border-brand-border overflow-hidden">
          <div
            className="w-full bg-brand-card animate-pulse motion-reduce:animate-none"
            style={{ aspectRatio: `${width} / ${height}` }}
          />
          <div className="p-2.5 border-t border-brand-border flex flex-col gap-1.5">
            <div className="h-3.5 w-16 rounded-md bg-brand-card animate-pulse motion-reduce:animate-none" />
            <div className="h-3 w-28 max-w-full rounded-md bg-brand-card animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </section>
  );
};
