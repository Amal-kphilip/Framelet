"use client";

import { useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";

type BezierEase = [number, number, number, number];
const EXPO_OUT: BezierEase = [0.16, 1, 0.3, 1];

function scrollTo(id: string, reduced: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

// Static gradient placeholder frame cards (no remote images)
const FRAME_CARDS = [
  {
    label: "00:04.12",
    gradient: "from-brand-accent/30 via-brand-card to-brand-surface",
    rotateDeg: -3,
    delay: 0,
    top: "top-0",
    left: "left-0",
    zIndex: "z-10",
  },
  {
    label: "00:12.48",
    gradient: "from-purple-500/20 via-brand-card to-brand-surface",
    rotateDeg: 2,
    delay: 0.1,
    top: "top-16",
    left: "left-24",
    zIndex: "z-20",
  },
  {
    label: "00:28.03",
    gradient: "from-blue-500/20 via-brand-card to-brand-surface",
    rotateDeg: -1,
    delay: 0.2,
    top: "top-32",
    left: "left-10",
    zIndex: "z-30",
  },
];

const HEADLINE_WORDS = ["Extract", "crisp", "frames", "from", "any", "video.", "Privately."];
const ACCENT_INDICES = [5, 6];

export function HeroSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced ? 0 : 0.07,
        delayChildren: reduced ? 0 : 0.1,
      },
    },
  };

  const wordVariant: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Hero"
      className="relative w-full min-h-[70vh] flex items-center overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20"
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className={[
            "absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px]",
            "rounded-full bg-brand-accent/10 blur-[80px]",
            reduced ? "" : "animate-pulse",
          ].join(" ")}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: text */}
          <div className="flex flex-col gap-6">
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EXPO_OUT }}
              className="inline-flex items-center gap-2 text-xs font-display font-700 uppercase tracking-widest text-brand-accent"
            >
              <span className="inline-block w-4 h-px bg-brand-accent" />
              Private · In-browser · Free
            </motion.p>

            {/* Headline — always readable even if JS/animations fail */}
            <motion.h1
              initial="hidden"
              animate="show"
              variants={containerVariants}
              className="font-display font-800 leading-[1.05] tracking-tight text-[clamp(2.25rem,5vw+1rem,4rem)]"
            >
              {HEADLINE_WORDS.map((word, i) => (
                <motion.span
                  key={i}
                  variants={wordVariant}
                  transition={{ duration: 0.6, ease: EXPO_OUT }}
                  className={[
                    "inline-block mr-[0.25em]",
                    ACCENT_INDICES.includes(i) ? "text-brand-accent" : "text-foreground",
                  ].join(" ")}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subcopy */}
            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduced ? 0 : 0.5, ease: EXPO_OUT }}
              className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg"
            >
              Drop a video, pick an interval, and download individual JPEG / PNG / WebP frames or a
              ZIP — all processed locally by your browser. Nothing leaves your device.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduced ? 0 : 0.65, ease: EXPO_OUT }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <button
                type="button"
                onClick={() => scrollTo("tool", !!reduced)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-accent text-white font-semibold text-sm hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              >
                <Play className="size-4" aria-hidden="true" />
                Upload a video
              </button>

              <button
                type="button"
                onClick={() => scrollTo("how-it-works", !!reduced)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass text-foreground font-semibold text-sm hover:border-brand-accent/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
              >
                How it works
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduced ? 0 : 0.75, ease: EXPO_OUT }}
              className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-muted-foreground"
            >
              {["500 frames max", "90s video limit", "JPEG · PNG · WebP", "ZIP export"].map(
                (stat) => (
                  <span key={stat} className="flex items-center gap-1.5">
                    <span className="inline-block size-1.5 rounded-full bg-brand-accent/60" />
                    {stat}
                  </span>
                )
              )}
            </motion.div>
          </div>

          {/* Right: floating frame cards (desktop only) */}
          <div aria-hidden="true" className="hidden lg:block relative h-[420px] select-none">
            {FRAME_CARDS.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: reduced ? 0 : 30, rotate: 0 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  rotate: reduced ? 0 : card.rotateDeg,
                }}
                transition={{
                  delay: reduced ? 0 : 0.3 + card.delay,
                  duration: 0.7,
                  ease: EXPO_OUT,
                }}
                className={[
                  "absolute w-56 aspect-video rounded-2xl glass overflow-hidden shadow-accent",
                  card.top,
                  card.left,
                  card.zIndex,
                ].join(" ")}
              >
                {/* Gradient placeholder */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
                {/* Fake scan lines */}
                <div className="absolute inset-0 opacity-10 [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.08)_2px,rgba(255,255,255,0.08)_4px)]" />
                {/* Timestamp badge */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-brand-surface/80 backdrop-blur-sm text-[10px] font-mono text-brand-accent font-semibold">
                  {card.label}
                </div>
                {/* Frame icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="size-8 text-white/20" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile: single static card */}
          <div aria-hidden="true" className="lg:hidden flex justify-center">
            <div className="relative w-64 aspect-video rounded-2xl glass overflow-hidden shadow-accent">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/30 via-brand-card to-brand-surface" />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-brand-surface/80 text-[10px] font-mono text-brand-accent font-semibold">
                00:04.12
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
