"use client";

import { useReducedMotion } from "framer-motion";

const WORDS = [
  "MP4",
  "WEBM",
  "MOV",
  "MKV",
  "AVI",
  "JPEG",
  "PNG",
  "WebP",
  "100% LOCAL",
  "NO UPLOAD",
  "MP4",
  "WEBM",
  "MOV",
  "MKV",
  "AVI",
  "JPEG",
  "PNG",
  "WebP",
  "100% LOCAL",
  "NO UPLOAD",
];

export function MarqueeStrip() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden -rotate-2 scale-[1.02] py-3 bg-brand-card border-y border-brand-border select-none"
    >
      <div
        className={[
          "flex gap-8 items-center whitespace-nowrap",
          reduced ? "" : "animate-marquee",
        ].join(" ")}
      >
        {WORDS.map((word, i) => (
          <span
            key={i}
            className={[
              "text-sm font-display font-700 uppercase tracking-widest shrink-0",
              i % 3 === 0 ? "text-brand-accent" : "text-outline",
            ].join(" ")}
          >
            {word}
            <span className="mx-4 text-brand-border">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
