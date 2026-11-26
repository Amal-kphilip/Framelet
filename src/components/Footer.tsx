"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import Typography from "./Typography";

const sideNavLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
];

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const visibleLinks = sideNavLinks.filter((link) => link.href !== pathname);

  return (
    <footer className="border-t-2 border-border xl:py-[var(--space-2xl)] pt-[var(--space-xl)] pb-[var(--space-xl)]">
      <div className="w-full flex flex-col gap-[var(--space-md)] sm:flex-row sm:justify-between sm:items-end">
        <div className="flex flex-col gap-1">
          <Typography variant="footer" muted>
            Built for fast, private client-side frame extraction.
          </Typography>
          <Typography as="p" variant="legal" muted>
            &copy; 2026 Amal K Philip &middot; MIT License
          </Typography>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-[var(--space-lg)] gap-y-2"
        >
          {visibleLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="underline underline-offset-4 type-fluid type-footer text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            className="underline underline-offset-4 type-fluid type-footer text-foreground hover:opacity-80 transition-opacity"
            href="https://github.com/Amal-kphilip/Framelet"
            target="_blank"
            rel="noopener noreferrer"
          >
            View source on GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
};

export const SideNav: React.FC = () => {
  const handleScrollTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <aside className="fixed flex-col items-start bottom-[var(--space-3xl)] ml-[var(--max-content-width)] hidden xl:flex pl-6 pointer-events-none">
      <div className="pointer-events-auto w-fit flex flex-col items-start">
        <button
          type="button"
          onClick={handleScrollTop}
          aria-label="Scroll to top"
          title="Scroll to top"
          className="size-9 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background text-foreground hover:bg-muted transition-colors"
        >
          <ArrowUp className="size-4" />
        </button>
      </div>
    </aside>
  );
};
