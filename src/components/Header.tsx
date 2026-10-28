"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Code, Moon, Sun, RotateCcw } from "lucide-react";
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
        className="min-h-20 sm:h-32 py-3 sm:py-0 flex flex-row gap-2 sm:gap-[var(--space-lg)] justify-between items-center w-full"
      >
        <div className="flex items-center min-w-0">
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
                width={36}
                height={36}
                priority
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0"
                style={{
                  filter: "invert(1) sepia(1) saturate(10000%) hue-rotate(340deg)",
                }}
              />
              <Typography as="span" variant="h1" className="leading-none">
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
                width={36}
                height={36}
                priority
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain shrink-0"
                style={{
                  filter: "invert(1) sepia(1) saturate(10000%) hue-rotate(340deg)",
                }}
              />
              <Typography as="span" variant="h1" className="leading-none">
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
              className="type-fluid type-button inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-4 rounded-corner border-2 border-foreground bg-background text-foreground hover:bg-muted transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="size-3.5 sm:size-4 shrink-0" />
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
            title="View source code on GitHub"
            className="inline-flex items-center justify-center size-9 sm:size-10 rounded-corner hover:bg-accent text-foreground transition-colors shrink-0"
          >
            <Code className="size-4 sm:size-5" />
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
            className="inline-flex items-center justify-center size-9 sm:size-10 rounded-corner hover:bg-accent text-foreground transition-colors shrink-0"
          >
            {theme === "dark" ? <Sun className="size-4 sm:size-5" /> : <Moon className="size-4 sm:size-5" />}
          </button>
        </div>
      </nav>
    </header>
  );
};
