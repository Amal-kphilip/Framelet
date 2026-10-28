"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import Typography from "./Typography";

export const Footer: React.FC = () => {
  return (
    <footer className="flex items-center xl:py-[var(--space-3xl)] pt-[var(--space-2xl)] pb-[var(--space-lg)]">
      <div className="w-full flex flex-col gap-[var(--space-lg)] sm:flex-row sm:justify-between sm:items-end">
        <Typography variant="footer" muted>
          Built for fast, private client-side frame extraction.
        </Typography>

        <a
          className="underline underline-offset-4 type-fluid type-footer"
          href="https://github.com/Amal-kphilip/Framelet"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </a>
      </div>
    </footer>
  );
};

const sideNavLinks = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
];

export const SideNav: React.FC = () => {
  const pathname = usePathname();
  const visibleLinks = sideNavLinks.filter((link) => link.href !== pathname);

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <aside className="fixed flex-col items-start bottom-[var(--space-3xl)] ml-[var(--max-content-width)] hidden xl:flex pl-6">
        <div className="pointer-events-auto w-fit flex flex-col items-start gap-[var(--space-lg)]">
          <button
            type="button"
            onClick={handleScrollTop}
            aria-label="Scroll to top"
            className="size-9 inline-flex items-center justify-center rounded-corner border-2 border-foreground bg-background text-foreground hover:bg-muted transition-colors"
          >
            <ArrowUp className="size-4" />
          </button>

          <nav className="flex flex-col items-start gap-[var(--space-md)]">
            {visibleLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground">
                <Typography as="span" variant="sidenav">
                  {link.label}
                </Typography>
              </Link>
            ))}
            <div className="flex gap-[var(--space-sm)] items-baseline select-none cursor-default">
              <Typography as="span" variant="legal" muted>
                &copy; {new Date().getFullYear()}
              </Typography>
              <Typography as="span" variant="legal" muted className="pt-[var(--space-sm)]">
                All rights reserved
              </Typography>
            </div>
          </nav>
        </div>
      </aside>

      <div className="flex flex-col-reverse sm:flex-row gap-[var(--space-lg)] items-start sm:items-center justify-between xl:hidden pb-[var(--space-2xl)]">
        <div className="flex gap-[var(--space-sm)] items-baseline select-none cursor-default">
          <Typography as="span" variant="legal" muted>
            &copy; {new Date().getFullYear()}
          </Typography>
          <Typography as="span" variant="legal" muted>
            All rights reserved
          </Typography>
        </div>
        <div className="flex items-start gap-[var(--space-lg)]">
          {visibleLinks.map((link) => (
            <Link key={link.label} href={link.href} className="text-muted-foreground hover:text-foreground">
              <Typography as="span" variant="sidenav">
                {link.label}
              </Typography>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
