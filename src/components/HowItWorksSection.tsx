"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Drop or select a video",
    desc: "Drag a video file onto the upload zone or click to browse. MP4, WebM, MOV, MKV, AVI — any format your browser's video codec supports.",
  },
  {
    num: "02",
    title: "Choose capture settings",
    desc: "Pick your capture mode (interval, fps, or count), output format (JPEG/PNG/WebP), quality, resolution scale, and optional trim range.",
  },
  {
    num: "03",
    title: "Extract and download",
    desc: "Click Extract, review your gallery, select the frames you want, and download them one by one or as a ZIP bundle — all locally.",
  },
];

export function HowItWorksSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, margin: "-60px" });

  return (
    <section id="how-it-works" className="w-full py-20 sm:py-28 bg-brand-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          animate={sectionInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-4 mb-14"
        >
          <p className="text-xs font-display font-700 uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-brand-accent" />
            How it works
            <span className="inline-block w-4 h-px bg-brand-accent" />
          </p>
          <h2 className="font-display font-800 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-tight text-foreground max-w-2xl">
            Three steps, entirely in your browser
          </h2>
        </motion.div>

        {/* Steps */}
        <div ref={sectionRef} className="relative">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-10 left-[calc(16.6%-1px)] right-[calc(16.6%-1px)] h-px bg-brand-border"
          >
            {!reduced && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={sectionInView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: "left" }}
                className="h-full bg-brand-accent/40"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
                animate={sectionInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: reduced ? 0 : 0.1 + i * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="glass rounded-3xl p-7 flex flex-col gap-4 relative"
              >
                {/* Number badge */}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-accent text-white font-display font-800 text-sm shrink-0 shadow-accent">
                  {step.num}
                </div>

                <h3 className="font-display font-700 text-foreground text-lg leading-snug">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Link to full page */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={sectionInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: reduced ? 0 : 0.5 }}
          className="mt-10 flex justify-center"
        >
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm text-brand-accent font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            Read the full guide
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
