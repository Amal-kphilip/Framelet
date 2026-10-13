"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  onReset?: () => void;
  hasVideo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasVideo }) => {
  return (
    <header className="framelet-header">
      <div className="framelet-header-inner">
        <button
          type="button"
          onClick={onReset}
          aria-label="Framelet home — reset current session"
          className="framelet-brand group"
        >
          <Image
            src="/icon.png"
            alt=""
            width={64}
            height={64}
            priority
            className="framelet-brand-icon"
          />
          <Image
            src="/logo.png"
            alt="Framelet"
            width={280}
            height={90}
            priority
            className="framelet-brand-wordmark"
          />
        </button>

        <nav className="framelet-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#why-framelet">Why Framelet</a>
          <a href="#extractor">Workspace</a>
        </nav>

        <div className="framelet-header-actions">
          <div className="framelet-local-indicator" title="Your video is processed in your browser">
            <span className="framelet-local-dot" />
            <span>Local processing</span>
          </div>
          {hasVideo && (
            <motion.button
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onReset}
              type="button"
              className="framelet-new-video"
            >
              New video
            </motion.button>
          )}
          <a href="#extractor" className="framelet-header-cta">
            <span>Get started</span>
            <span className="framelet-cta-arrow"><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span>
          </a>
        </div>
      </div>
    </header>
  );
};
