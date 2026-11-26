"use client";

import React, { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import Typography from "./Typography";

interface ShareFunctionsProps {
  onNotify?: (type: "info" | "success", title: string, message: string) => void;
}

export const ShareFunctions: React.FC<ShareFunctionsProps> = ({ onNotify }) => {
  const SHARE_URL = "https://framelet.vercel.app/";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      onNotify?.("success", "Link copied", "Framelet URL copied to your clipboard.");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Framelet | Frame Extractor",
          text: "Extract still frames from videos directly in your browser with no file uploads.",
          url: SHARE_URL,
        });
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      }
    }
    await handleCopy();
  };

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-[var(--space-md)]">
      <Typography variant="bodySm" muted>
        100% client-side · No uploads · Open source
      </Typography>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href="https://github.com/Amal-kphilip/Framelet"
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-3 rounded-corner type-fluid type-button inline-flex items-center gap-2 bg-background hover:bg-muted text-foreground border-foreground border-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
          <span>GitHub</span>
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="h-9 px-3 rounded-corner type-fluid type-button inline-flex items-center gap-2 bg-background hover:bg-muted text-foreground border-foreground border-2 transition-colors"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          <span>{copied ? "Copied" : "Copy link"}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="h-9 px-3 rounded-corner type-fluid type-button inline-flex items-center gap-2 bg-background hover:bg-muted text-foreground border-foreground border-2 transition-colors"
        >
          <Share2 className="size-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};
