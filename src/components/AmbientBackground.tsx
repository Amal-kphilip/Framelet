"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Warm, low-contrast ambient light for the editorial Framelet shell. */
export const AmbientBackground: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="framelet-ambient" aria-hidden="true">
      <div className="framelet-ambient-wash" />
      <motion.div
        className="framelet-ambient-glow framelet-ambient-glow-left"
        animate={reduceMotion ? { opacity: 0.75 } : { opacity: [0.58, 0.82, 0.58], x: [0, 18, 0], y: [0, -12, 0] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 18, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="framelet-ambient-glow framelet-ambient-glow-bottom"
        animate={reduceMotion ? { opacity: 0.42 } : { opacity: [0.3, 0.52, 0.3], x: [0, -15, 0], y: [0, 12, 0] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 23, ease: "easeInOut", repeat: Infinity, delay: 2 }}
      />
    </div>
  );
};
