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
  Search,
} from "lucide-react";
import { ExtractedFrame } from "@/types";
import { downloadSingleFrame } from "@/lib/zipExporter";
import Typography from "./Typography";

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
  const lastTapRef = useRef<{ id: string; time: number }>({ id: "", time: 0 });

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
    if (lastTap.id === frame.id && now - lastTap.time < 350) {
      lastTapRef.current = { id: "", time: 0 };
      onPreviewFrame(frame);
      return;
    }
    lastTapRef.current = { id: frame.id, time: now };
    onToggleSelect(frame.id);
  };

  return (
    <section aria-labelledby="frame-gallery-heading" className="w-full flex flex-col gap-[var(--space-lg)]">
      {/* Toolbar */}
      <div className="border-2 border-foreground rounded-corner bg-background p-4 sm:p-[var(--space-xl)] flex flex-col gap-4 sm:gap-[var(--space-lg)] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-md)]">
          <div>
            <Typography as="h2" id="frame-gallery-heading" variant="label" weight={600}>
              Extracted frames
            </Typography>
            <Typography as="p" variant="bodySm" muted>
              {selectedCount} of {frames.length} selected · {filteredFrames.length} shown · Double-click a frame to expand
            </Typography>
          </div>

          <div className="flex items-center flex-wrap gap-[var(--space-sm)]">
            <button
              type="button"
              onClick={isAllSelected ? onDeselectAll : onSelectAll}
              className="type-fluid type-button h-9 px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              {isAllSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
              <span>{isAllSelected ? "Deselect all" : "Select all"}</span>
            </button>
            <button
              type="button"
              onClick={onInvertSelection}
              className="type-fluid type-button h-9 px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="size-4" />
              <span>Invert</span>
            </button>
          </div>
        </div>

        {/* Search, Filter, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-md)]">
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
              placeholder="Search frame # or timestamp..."
              className="type-fluid type-button w-full h-10 rounded-corner border-2 border-foreground bg-background pl-9 pr-3 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
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
              className="type-fluid type-button w-full h-10 rounded-corner border-2 border-foreground bg-background px-3 text-foreground"
            >
              <option value="all">All frames</option>
              <option value="selected">Selected only</option>
              <option value="unselected">Unselected only</option>
            </select>
          </div>

          <div>
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
              className="type-fluid type-button w-full h-10 rounded-corner border-2 border-foreground bg-background px-3 text-foreground"
            >
              <option value="time-asc">Oldest timestamp first</option>
              <option value="time-desc">Newest timestamp first</option>
              <option value="size-desc">Largest file first</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Typography as="span" variant="legal" muted>
            {filteredFrames.length
              ? `Showing ${firstVisible}–${lastVisible} of ${filteredFrames.length}`
              : "No frames match these filters"}
          </Typography>
          <Typography as="span" variant="legal" muted className="hidden sm:inline">
            Click to select · Double-click to expand
          </Typography>
        </div>
      </div>

      {/* Zero-Lag Crisp Frame Grid */}
      {visibleFrames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[var(--space-md)] items-start">
          {visibleFrames.map((frame) => (
            <article
              key={frame.id}
              className={`group relative rounded-corner border-2 overflow-hidden bg-background transition-colors ${
                frame.selected
                  ? "border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]"
                  : "border-foreground"
              }`}
            >
              <div
                className="relative w-full overflow-hidden bg-secondary flex items-center justify-center cursor-pointer"
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
                <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded-corner border border-foreground bg-background text-foreground text-[11px] font-mono font-semibold pointer-events-none">
                  #{frame.index}
                </div>

                {/* Selection Checkbox Badge */}
                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                  <span
                    className={`size-6 rounded-corner border-2 flex items-center justify-center transition-colors ${
                      frame.selected
                        ? "border-foreground bg-[var(--accent-primary)] text-white"
                        : "border-foreground bg-background text-transparent"
                    }`}
                  >
                    <Check className="size-4 stroke-[2.5]" aria-hidden="true" />
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t-2 border-foreground bg-background">
                <div className="min-w-0">
                  <Typography as="span" variant="legal" weight={600} className="font-mono block leading-tight">
                    {frame.formattedTime}
                  </Typography>
                  <Typography as="span" variant="legal" muted className="font-mono block leading-tight truncate">
                    {frame.width}×{frame.height} · {(frame.sizeBytes / 1024).toFixed(frame.sizeBytes < 1024 * 100 ? 1 : 0)} KB
                  </Typography>
                </div>

                <div className="flex items-center justify-end gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label={`Preview frame ${frame.index}`}
                    title="Expand preview"
                    onClick={() => onPreviewFrame(frame)}
                    className="size-8 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors"
                  >
                    <ZoomIn className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Download frame ${frame.index}`}
                    title="Download frame"
                    onClick={() => downloadSingleFrame(frame, videoName)}
                    className="size-8 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Download className="size-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border-2 border-foreground rounded-corner bg-background p-[var(--space-2xl)] flex flex-col items-center text-center gap-[var(--space-sm)]">
          <Typography as="p" variant="label" weight={600}>
            No matching frames
          </Typography>
          <Typography as="p" variant="bodySm" muted>
            Change the timestamp search or selection filter to see results.
          </Typography>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
              setCurrentPage(1);
            }}
            className="mt-2 type-fluid type-button h-9 px-4 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <nav aria-label="Frame gallery pages" className="flex items-center justify-center gap-[var(--space-md)] pt-2">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
            disabled={safePage === 1}
            className="type-fluid type-button h-9 px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </button>
          <Typography as="span" variant="bodySm" weight={600} className="font-mono">
            Page {safePage} of {pageCount}
          </Typography>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(pageCount, safePage + 1))}
            disabled={safePage === pageCount}
            className="type-fluid type-button h-9 px-3 rounded-corner border-2 border-foreground bg-background hover:bg-muted text-foreground inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="size-4" />
          </button>
        </nav>
      )}
    </section>
  );
};
