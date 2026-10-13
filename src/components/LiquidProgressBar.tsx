"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, Check, Clock, Cpu, Film, Layers, PackageCheck, X } from "lucide-react";

interface LiquidProgressBarProps {
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  statusText?: string;
  onCancel?: () => void;
}

export const LiquidProgressBar: React.FC<LiquidProgressBarProps> = ({
  progress,
  currentFrame = 0,
  totalFrames = 0,
  statusText = "Extracting video frames...",
  onCancel,
}) => {
  const reduceMotion = useReducedMotion();
  const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const isPreparing = roundedProgress < 2 && /prepar|decoder|initial/i.test(statusText);
  const isFinalizing = roundedProgress >= 98 || /final|packag|complete/i.test(statusText);
  const activeStage = isPreparing ? 0 : isFinalizing ? 2 : 1;
  const stages = [
    { label: "Decode", detail: "Read source", icon: Cpu },
    { label: "Capture", detail: totalFrames > 0 ? `${Math.min(currentFrame, totalFrames).toLocaleString()} / ${totalFrames.toLocaleString()} frames` : "Sampling frames", icon: Film },
    { label: "Finalize", detail: "Prepare images", icon: PackageCheck },
  ];

  return (
    <motion.section
      aria-labelledby="framelet-progress-title"
      initial={reduceMotion ? false : { opacity: 0, y: 18, clipPath: "inset(8% 0 0 0 round 24px)" }}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0 0 0 round 24px)" }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -10, scale: 0.99 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="framelet-progress-panel"
    >
      <div className="framelet-progress-ambient" aria-hidden="true" />
      <div className="framelet-progress-topline">
        <div className="framelet-progress-live-label"><span className="framelet-progress-live-dot" /> LIVE PROCESS <span>/</span> LOCAL ENGINE</div>
        {onCancel && <button type="button" onClick={onCancel} className="framelet-progress-cancel" aria-label="Cancel frame extraction"><X className="h-3.5 w-3.5" /> Cancel extraction</button>}
      </div>

      <div className="framelet-progress-main">
        <div className="framelet-progress-copy">
          <div className="framelet-progress-heading-row">
            <motion.div
              className="framelet-progress-icon"
              animate={reduceMotion ? undefined : { rotate: [0, 4, -4, 0], scale: [1, 1.03, 1] }}
              transition={reduceMotion ? undefined : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden="true"
            >
              <Activity className="h-5 w-5" />
            </motion.div>
            <div>
              <h3 id="framelet-progress-title">Finding the <span>right frames.</span></h3>
              <p className="framelet-progress-status" aria-live="polite">{statusText}</p>
            </div>
          </div>
          <p className="framelet-progress-explainer">Your video is being decoded in this browser. Keep this tab open while Framelet captures and prepares your stills.</p>
          <div className="framelet-progress-stages" aria-label="Extraction stages">
            {stages.map((stage, index) => {
              const StageIcon = stage.icon;
              const complete = index < activeStage || roundedProgress === 100;
              const active = index === activeStage && roundedProgress < 100;
              return (
                <div key={stage.label} className={`framelet-progress-stage ${complete ? "is-complete" : ""} ${active ? "is-active" : ""}`}>
                  <span className="framelet-stage-icon">{complete ? <Check className="h-3.5 w-3.5" /> : <StageIcon className="h-3.5 w-3.5" />}</span>
                  <span className="framelet-stage-text"><strong>{stage.label}</strong><small>{stage.detail}</small></span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="framelet-progress-dial" aria-label={`${roundedProgress}% complete`}>
          <div className="framelet-progress-dial-inner">
            <span className="framelet-progress-dial-kicker">CAPTURE</span>
            <strong>{roundedProgress}<small>%</small></strong>
            <span className="framelet-progress-dial-caption">{roundedProgress === 100 ? "READY" : "IN PROGRESS"}</span>
          </div>
          <svg className="framelet-progress-dial-svg" viewBox="0 0 160 160" aria-hidden="true">
            <circle className="framelet-progress-dial-track" cx="80" cy="80" r="69" />
            <motion.circle
              className="framelet-progress-dial-fill"
              cx="80" cy="80" r="69"
              initial={{ strokeDashoffset: 433.54 }}
              animate={{ strokeDashoffset: 433.54 * (1 - roundedProgress / 100) }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
              transform="rotate(-90 80 80)"
            />
          </svg>
          {!reduceMotion && roundedProgress < 100 && <motion.span className="framelet-progress-dial-spark" animate={{ rotate: 360 }} transition={{ duration: 8, ease: "linear", repeat: Infinity }} />}
        </div>
      </div>

      <div className="framelet-progress-track-wrap">
        <div className="framelet-progress-track-meta"><span><Layers className="h-3.5 w-3.5" /> FRAME SEQUENCE</span><strong>{totalFrames > 0 ? <>{Math.min(currentFrame, totalFrames).toLocaleString()} <em>/</em> {totalFrames.toLocaleString()}</> : "Preparing sequence"}</strong></div>
        <div className="framelet-progress-track" role="progressbar" aria-label="Frame extraction progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={roundedProgress} aria-valuetext={`${roundedProgress}% complete`}>
          <motion.div className="framelet-progress-track-fill" initial={{ width: "0%" }} animate={{ width: `${roundedProgress}%` }} transition={{ duration: reduceMotion ? 0 : 0.32, ease: "easeOut" }}>
            {!reduceMotion && roundedProgress > 0 && roundedProgress < 100 && <motion.span className="framelet-progress-track-sheen" animate={{ x: ["-120%", "350%"] }} transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }} />}
          </motion.div>
          <div className="framelet-progress-track-ticks" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} />)}</div>
        </div>
        <div className="framelet-progress-footer"><span><Clock className="h-3.5 w-3.5" /> Processing happens on this device</span><span>{roundedProgress === 100 ? "Final pass complete" : "No upload · No queue · No account"}</span></div>
      </div>
    </motion.section>
  );
};
