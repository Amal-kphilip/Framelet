"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Are my videos uploaded to a server?",
    a: "No. Framelet runs entirely in your browser using the HTML5 Canvas API. Your video files are read locally and are never transmitted anywhere. No server, no cloud, no account.",
  },
  {
    q: "Which video formats are supported?",
    a: "Framelet accepts MP4, WebM, MOV, MKV, and AVI files. The actual codecs your browser can decode vary by browser and OS — if a file loads in your browser's native video player, it will work here.",
  },
  {
    q: "Why won't my video load or decode?",
    a: "Even if the file extension is accepted, the video codec inside may not be supported by your browser. Try re-encoding with H.264 (MP4) which has the widest browser support.",
  },
  {
    q: "What are the limits?",
    a: "Videos are capped at 90 seconds of source duration. Up to 500 frames can be extracted per session. A soft 512 MiB guardrail prevents the output from exceeding your browser's memory budget.",
  },
  {
    q: "Is Framelet free and open source?",
    a: "Yes. Framelet is released under the MIT License. The full source code is available on GitHub at github.com/Amal-kphilip/Framelet.",
  },
];

function FAQItem({
  q,
  a,
  index,
  reduced,
}: {
  q: string;
  a: string;
  index: number;
  reduced: boolean | null;
}) {
  const [open, setOpen] = useState(false);
  const id = `faq-answer-${index}`;
  const btnId = `faq-btn-${index}`;

  return (
    <div className="border border-brand-border rounded-2xl overflow-hidden transition-colors hover:border-brand-accent/30">
      <button
        id={btnId}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
      >
        <span className="font-display font-700 text-foreground text-sm sm:text-base leading-snug">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 text-brand-accent"
        >
          <ChevronDown className="size-5" aria-hidden="true" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-labelledby={btnId}
            key="answer"
            initial={{ height: 0, opacity: reduced ? 1 : 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: reduced ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="faq" className="w-full py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-4 mb-12"
        >
          <p className="text-xs font-display font-700 uppercase tracking-widest text-brand-accent flex items-center gap-2">
            <span className="inline-block w-4 h-px bg-brand-accent" />
            FAQ
            <span className="inline-block w-4 h-px bg-brand-accent" />
          </p>
          <h2 className="font-display font-800 text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] tracking-tight text-foreground">
            Common questions
          </h2>
        </motion.div>

        {/* Accordion */}
        <div ref={ref} className="flex flex-col gap-3">
          {FAQS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: reduced ? 0 : i * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <FAQItem q={item.q} a={item.a} index={i} reduced={reduced} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
