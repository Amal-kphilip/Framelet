"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Moon, Sun, RotateCcw } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import Typography from "./Typography";

interface HeaderProps {
  onReset?: () => void;
  hasVideo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasVideo }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="relative z-40 w-full">
      <nav
        aria-label="Main navigation"
        className="min-h-20 sm:h-32 py-3 sm:py-0 flex flex-row gap-3 sm:gap-[var(--space-lg)] justify-between items-center w-full"
      >
        <div className="flex items-center shrink-0">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              aria-label="Framelet home — reset current session"
              className="flex items-center gap-2 sm:gap-[var(--fluid-sm-lg)] text-left cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            >
              <Image
                src="/icon.png"
                alt=""
                width={44}
                height={44}
                priority
                className="w-8 h-8 sm:w-11 sm:h-11 object-contain shrink-0"
                style={{
                  filter: "invert(1) sepia(1) saturate(10000%) hue-rotate(340deg) brightness(1.15)",
                }}
              />
              <Typography as="span" variant="h1" className="leading-none whitespace-nowrap">
                Framelet
              </Typography>
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go to Framelet homepage"
              className="flex items-center gap-2 sm:gap-[var(--fluid-sm-lg)] hover:opacity-80 transition-opacity shrink-0"
            >
              <Image
                src="/icon.png"
                alt=""
                width={44}
                height={44}
                priority
                className="w-8 h-8 sm:w-11 sm:h-11 object-contain shrink-0"
                style={{
                  filter: "invert(1) sepia(1) saturate(10000%) hue-rotate(340deg) brightness(1.15)",
                }}
              />
              <Typography as="span" variant="h1" className="leading-none whitespace-nowrap">
                Framelet
              </Typography>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-[var(--space-md)] shrink-0">
          {hasVideo && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="hidden sm:inline-flex type-fluid type-button items-center justify-center gap-1.5 h-10 px-4 rounded-corner border-2 border-foreground bg-background text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="size-4 shrink-0" />
              <span>New video</span>
            </button>
          )}

          <Link
            href="/how-it-works"
            className="hidden sm:inline-flex type-fluid type-button items-center h-10 px-3 rounded-corner text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap"
          >
            How it works
          </Link>

          <a
            href="https://github.com/Amal-kphilip/Framelet"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className="inline-flex items-center justify-center size-9 sm:size-10 rounded-corner hover:bg-accent text-foreground transition-colors shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="size-4 sm:size-5"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
            </svg>
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="inline-flex items-center justify-center size-9 sm:size-10 rounded-corner hover:bg-accent text-foreground transition-colors shrink-0"
          >
            {theme === "dark" ? (
              <Sun className="size-4 sm:size-5" />
            ) : (
              <Moon className="size-4 sm:size-5" />
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};
