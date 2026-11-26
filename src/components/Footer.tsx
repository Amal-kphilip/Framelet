"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";

const REPO_URL = "https://github.com/Amal-kphilip/Framelet";

const footerColumns = {
  Product: [
    { name: "Workspace", href: "#tool", internal: true },
    { name: "Features", href: "#features", internal: true },
    { name: "How it works", href: "/how-it-works", internal: true },
    { name: "FAQ", href: "#faq", internal: true },
  ],
  Project: [
    { name: "GitHub repo", href: REPO_URL, internal: false },
    { name: "Releases", href: `${REPO_URL}/releases`, internal: false },
    { name: "Report an issue", href: `${REPO_URL}/issues`, internal: false },
    { name: "Security policy", href: `${REPO_URL}/blob/main/SECURITY.md`, internal: false },
    { name: "Contributing", href: `${REPO_URL}/blob/main/CONTRIBUTING.md`, internal: false },
  ],
  Legal: [{ name: "MIT License", href: `${REPO_URL}/blob/main/LICENSE`, internal: false }],
};

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleScrollToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    if (pathname === "/") {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    } else {
      e.preventDefault();
      router.push(`/${href}`);
    }
  };

  return (
    <footer className="bg-brand-surface border-t border-brand-border pt-16 pb-10 relative z-10 overflow-hidden">
      {/* Faint ambient orange glow */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[180px] bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 pb-12 border-b border-brand-border">
          {/* Brand Info */}
          <div className="col-span-2 flex flex-col space-y-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display font-bold text-foreground w-fit"
            >
              <span className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-[#0b0b0d] font-black text-base select-none">
                F
              </span>
              <span className="tracking-widest text-base sm:text-lg font-bold">
                FRAMELET<span className="text-brand-accent">.</span>
              </span>
            </Link>

            <p className="text-brand-muted text-xs sm:text-sm leading-relaxed max-w-sm">
              Extract crisp still frames from short videos directly in your browser. Zero uploads,
              built-in guardrails, and open source under the MIT License.
            </p>

            {/* Socials */}
            <div className="flex items-center gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Framelet on GitHub"
                title="GitHub"
                className="w-9 h-9 rounded-lg bg-accent border border-brand-border hover:border-brand-accent/40 text-brand-muted hover:text-brand-accentText flex items-center justify-center transition-colors"
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
              </a>

              <a
                href="https://x.com/AmalkPhilip"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Amal K Philip on X"
                title="X"
                className="w-9 h-9 rounded-lg bg-accent border border-brand-border hover:border-brand-accent/40 text-brand-muted hover:text-brand-accentText flex items-center justify-center transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerColumns).map(([title, links]) => (
            <div key={title} className="col-span-1 flex flex-col space-y-3.5">
              <h4 className="text-xs font-display font-bold text-foreground tracking-widest uppercase">
                {title}
              </h4>
              <ul className="flex flex-col space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.internal && !link.href.startsWith("#") ? (
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-brand-muted hover:text-brand-accentText transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    ) : link.internal ? (
                      <a
                        href={pathname === "/" ? link.href : `/${link.href}`}
                        onClick={(e) => handleAnchorClick(e, link.href)}
                        className="text-xs sm:text-sm text-brand-muted hover:text-brand-accentText transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm text-brand-muted hover:text-brand-accentText transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row: copyright + scroll to top inside container */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4">
          <p className="text-xs text-brand-muted">&copy; 2026 Amal K Philip &middot; MIT License</p>

          <button
            type="button"
            onClick={handleScrollToTop}
            aria-label="Scroll to top"
            className="group inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-foreground transition-colors"
          >
            <span>Back to top</span>
            <span className="w-8 h-8 rounded-lg bg-accent border border-brand-border group-hover:border-brand-accent/40 flex items-center justify-center text-brand-muted group-hover:text-brand-accentText transition-all duration-300 group-hover:-translate-y-0.5 motion-reduce:transform-none">
              <ArrowUp size={14} aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};
