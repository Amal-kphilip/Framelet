"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Shield,
  Layers,
  FileImage,
  Archive,
  Lock,
  Keyboard,
  Camera,
  Scissors,
  Scaling,
  Tag,
} from "lucide-react";

type BezierEase = [number, number, number, number];
const EXPO_OUT: BezierEase = [0.16, 1, 0.3, 1];

const FEATURES = [
  {
    icon: Shield,
    title: "In-browser processing",
    desc: "Video frames are decoded and exported entirely on your device using the HTML5 Canvas API. Zero uploads, zero servers.",
  },
  {
    icon: Layers,
    title: "Three capture modes",
    desc: "Extract at a fixed interval (every N seconds), at a chosen frame rate (N fps), or by exact frame count — whatever your workflow needs.",
  },
  {
    icon: FileImage,
    title: "JPEG · PNG · WebP",
    desc: "Export each frame as the format that suits you: JPEG for small size, PNG for lossless, or WebP for the best of both.",
  },
  {
    icon: Archive,
    title: "ZIP with manifest",
    desc: "Download all selected frames in one ZIP bundle. A metadata.json manifest is included with timestamps, dimensions, and format info.",
  },
  {
    icon: Lock,
    title: "Built-in safety guardrails",
    desc: "Hard limits keep extraction reliable: 90-second source cap, 500-frame maximum, and a 512 MiB output guardrail — all enforced client-side.",
  },
  {
    icon: Keyboard,
    title: "Keyboard accessible",
    desc: "Full keyboard navigation: Escape to close modals, arrow keys to navigate frames, Tab / Shift-Tab through controls. Focus rings always visible.",
  },
  {
    icon: Camera,
    title: "Capture current frame",
    desc: "Scrub to any point in the video and click Capture to grab that exact frame and add it to your gallery instantly.",
  },
  {
    icon: Scissors,
    title: "Trim range",
    desc: "Set a start and end time to extract frames only from the portion of the video you care about.",
  },
  {
    icon: Scaling,
    title: "Resolution scale",
    desc: "Output frames at 25 %, 50 %, 75 %, or 100 % of the source resolution to control file size.",
  },
  {
    icon: Tag,
    title: "Filename templates",
    desc: "Customise output filenames with tokens like {name}, {index}, {time}, and {ext} to match your project conventions.",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  desc,
  index,
  reduced,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  index: number;
  reduced: boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: reduced ? 0 : (index % 3) * 0.08,
        ease: EXPO_OUT,
      }}
      className="glass rounded-3xl p-6 flex flex-col gap-4 group hover:border-brand-accent/30 transition-colors"
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent/20 transition-colors">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-display font-700 text-foreground text-base mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  const reduced = useReducedMotion();
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

  return (
    <section id="features" className="w-full py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EXPO_OUT }}
          className="flex flex-col items-center text-center gap-4 mb-14"
        >
          <p className="text-xs font-display font-700 uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-brand-accent" />
            Features
            <span className="inline-block w-4 h-px bg-brand-accent" />
          </p>
          <h2 className="font-display font-800 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-tight text-foreground max-w-2xl">
            Everything you need to work with frames
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl leading-relaxed">
            Powerful extraction controls, flexible export options, and strict privacy — all running
            in your browser with no account required.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  );
}
