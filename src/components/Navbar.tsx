"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

interface NavbarProps {
  onReset?: () => void;
  hasVideo?: boolean;
}

const navLinks = [
  { name: "Workspace", href: "#tool" },
  { name: "Features", href: "#features" },
  { name: "How it works", href: "#how-it-works" },
  { name: "FAQ", href: "#faq" },
];

export const Navbar: React.FC<NavbarProps> = ({ onReset, hasVideo }) => {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.requestAnimationFrame(() => {
      const firstLink = mobileMenuRef.current?.querySelector<HTMLElement>("a, button");
      firstLink?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !mobileMenuRef.current) return;
      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const navigateToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setIsMobileMenuOpen(false);
    if (pathname === "/" && href.startsWith("#")) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    } else if (href.startsWith("#")) {
      e.preventDefault();
      router.push(`/${href}`);
    }
  };

  const menuVariants = prefersReducedMotion
    ? {
        closed: { opacity: 0 },
        open: { opacity: 1 },
      }
    : {
        closed: {
          opacity: 0,
          y: "-100%",
          transition: {
            duration: 0.45,
            ease: [0.16, 1, 0.3, 1] as const,
            when: "afterChildren",
            staggerChildren: 0.04,
            staggerDirection: -1,
          },
        },
        open: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1] as const,
            when: "beforeChildren",
            staggerChildren: 0.07,
          },
        },
      };

  const linkVariants = prefersReducedMotion
    ? { closed: { opacity: 0 }, open: { opacity: 1 } }
    : {
        closed: { opacity: 0, y: 18 },
        open: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

  const themeLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "glass-navbar py-3.5" : "bg-transparent py-5 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo */}
          {onReset && hasVideo ? (
            <button
              type="button"
              onClick={onReset}
              aria-label="Framelet home — reset current session"
              className="flex items-center gap-2.5 text-left font-display font-bold text-foreground hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-[#0b0b0d] font-black text-base select-none">
                F
              </span>
              <span className="tracking-widest text-base sm:text-lg font-bold">
                FRAMELET<span className="text-brand-accent">.</span>
              </span>
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Go to Framelet homepage"
              className="flex items-center gap-2.5 font-display font-bold text-foreground hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-[#0b0b0d] font-black text-base select-none">
                F
              </span>
              <span className="tracking-widest text-base sm:text-lg font-bold">
                FRAMELET<span className="text-brand-accent">.</span>
              </span>
            </Link>
          )}

          {/* Desktop Nav Links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={pathname === "/" ? link.href : `/${link.href}`}
                onClick={(e) => navigateToSection(e, link.href)}
                className="text-sm font-medium text-brand-muted hover:text-brand-accent transition-colors duration-200 whitespace-nowrap"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <a
              href="https://github.com/Amal-kphilip/Framelet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              title="View source on GitHub"
              className="p-2 rounded-full border border-brand-border bg-accent hover:border-brand-borderHover text-brand-muted hover:text-foreground transition-colors"
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

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className="p-2 rounded-full border border-brand-border bg-accent hover:border-brand-borderHover text-brand-muted hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <a
              href={pathname === "/" ? "#tool" : "/#tool"}
              onClick={(e) => navigateToSection(e, "#tool")}
              className="group relative px-5 py-2 rounded-full bg-brand-accent text-[#0b0b0d] text-sm font-semibold tracking-wide shadow-accent hover:shadow-accent-strong transition-all duration-300 ease-expo-out hover:scale-[1.03] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Extract frames</span>
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform motion-reduce:transform-none"
                aria-hidden="true"
              />
            </a>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <a
              href="https://github.com/Amal-kphilip/Framelet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              title="View source on GitHub"
              className="p-2 rounded-full border border-brand-border bg-accent text-brand-muted hover:text-foreground transition-colors"
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

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
              className="p-2 rounded-full border border-brand-border bg-accent text-brand-muted hover:text-foreground transition-colors"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="p-2 rounded-lg text-foreground hover:text-brand-accent transition-colors"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 z-50 bg-brand-bg/95 backdrop-blur-xl flex flex-col justify-between p-6 pt-8 md:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-bold tracking-widest text-base text-foreground">
                FRAMELET<span className="text-brand-accent">.</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  menuButtonRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-foreground hover:text-brand-accent transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <nav aria-label="Mobile navigation links" className="flex flex-col space-y-6 my-auto">
              {navLinks.map((link) => (
                <motion.div variants={linkVariants} key={link.name}>
                  <a
                    href={pathname === "/" ? link.href : `/${link.href}`}
                    onClick={(e) => navigateToSection(e, link.href)}
                    className="text-3xl font-display font-bold text-foreground hover:text-brand-accent transition-colors block"
                  >
                    {link.name}
                  </a>
                </motion.div>
              ))}
            </nav>

            <motion.div variants={linkVariants} className="w-full pb-4">
              <a
                href={pathname === "/" ? "#tool" : "/#tool"}
                onClick={(e) => navigateToSection(e, "#tool")}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-brand-accent text-[#0b0b0d] font-semibold tracking-wide shadow-accent"
              >
                <span>Extract frames</span>
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
