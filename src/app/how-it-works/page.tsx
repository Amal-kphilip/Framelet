import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer, SideNav } from "@/components/Footer";
import Typography from "@/components/Typography";

export const metadata: Metadata = {
  title: "How it Works | Framelet",
  description:
    "See how Framelet extracts high-resolution still frames from videos directly in your browser with no file uploads.",
};

const Divider = () => <div className="h-[3px] w-full bg-foreground" />;

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col flex-1 w-full">
      <Header />
      <main className="flex-1 w-full flex flex-col gap-[var(--fluid-xl-3xl)] py-[var(--fluid-lg-3xl)]">
        {/* Hero */}
        <section className="w-full">
          <Typography as="h1" variant="hero">
            Framelet extracts crisp still frames from your videos directly in your browser, so your files never leave your device.
          </Typography>
        </section>

        {/* Steps */}
        <section className="w-full flex flex-col gap-[var(--space-2xl)]">
          <Typography as="h2" variant="label" muted>
            How it works
          </Typography>
          <div className="flex flex-col gap-[var(--fluid-2xl-3xl)]">
            <div className="flex gap-[var(--space-xl)]">
              <Typography variant="label" muted className="shrink-0 w-8 font-mono">
                01
              </Typography>
              <div className="flex flex-col gap-[var(--space-sm)]">
                <Typography as="h3" variant="bodyLg" weight={600}>
                  Drop your video.
                </Typography>
                <Typography variant="body" muted>
                  The app reads your video directly in your browser. File bytes are never uploaded or sent to any remote server.
                </Typography>
              </div>
            </div>

            <div className="flex gap-[var(--space-xl)]">
              <Typography variant="label" muted className="shrink-0 w-8 font-mono">
                02
              </Typography>
              <div className="flex flex-col gap-[var(--space-sm)]">
                <Typography as="h3" variant="bodyLg" weight={600}>
                  Choose your capture interval &amp; format.
                </Typography>
                <Typography variant="body" muted>
                  Pick a capture rate by seconds or FPS, and choose JPEG, PNG, or WebP output at your source video&apos;s native resolution.
                </Typography>
              </div>
            </div>

            <div className="flex gap-[var(--space-xl)]">
              <Typography variant="label" muted className="shrink-0 w-8 font-mono">
                03
              </Typography>
              <div className="flex flex-col gap-[var(--space-sm)]">
                <Typography as="h3" variant="bodyLg" weight={600}>
                  Select and download frames.
                </Typography>
                <Typography variant="body" muted>
                  Double-click any frame to inspect it in full size, save individual images, or export your selected stills into a flat ZIP archive.
                </Typography>
              </div>
            </div>
          </div>
        </section>

        <Divider />

        {/* Supported Formats */}
        <section className="w-full flex flex-col gap-[var(--space-lg)]">
          <Typography as="h2" variant="label" muted>
            Supported formats
          </Typography>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[var(--space-lg)]">
            <div className="flex flex-col gap-[var(--space-sm)]">
              <Typography variant="label" weight={600}>
                Video Input
              </Typography>
              <Typography variant="body" muted>
                MP4, WEBM, MOV, MKV, AVI (up to 90s)
              </Typography>
            </div>
            <div className="flex flex-col gap-[var(--space-sm)]">
              <Typography variant="label" weight={600}>
                Image Output
              </Typography>
              <Typography variant="body" muted>
                JPEG, PNG (Lossless), WebP
              </Typography>
            </div>
            <div className="flex flex-col gap-[var(--space-sm)]">
              <Typography variant="label" weight={600}>
                Batch Export
              </Typography>
              <Typography variant="body" muted>
                Flat ZIP archive + JSON manifest
              </Typography>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full rounded-corner border-2 border-foreground bg-foreground p-[var(--space-3xl)] flex flex-col items-center gap-[var(--space-lg)] text-center">
          <Typography as="p" variant="hero" className="text-background">
            Try it now. No sign-up, no upload, no catch.
          </Typography>
          <Link
            href="/"
            className="type-fluid type-button-lg h-11 px-6 rounded-corner bg-background text-foreground hover:opacity-90 inline-flex items-center gap-2 transition-opacity"
          >
            <span>Extract frames</span>
            <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* FAQ */}
        <section className="w-full flex flex-col gap-[var(--space-2xl)]">
          <Typography as="h2" variant="label" muted>
            Frequently asked questions
          </Typography>

          <div className="flex flex-col gap-[var(--space-2xl)]">
            <div className="flex flex-col gap-[var(--space-sm)]">
              <Typography as="h3" variant="bodyLg" weight={600}>
                Are my videos uploaded to a server?
              </Typography>
              <Typography variant="body" muted>
                No. All video decoding and frame rendering happen locally inside your browser using HTML5 video and canvas APIs. Your files never leave your device.
              </Typography>
            </div>

            <div className="flex flex-col gap-[var(--space-sm)]">
              <Typography as="h3" variant="bodyLg" weight={600}>
                Are frames saved in their original resolution?
              </Typography>
              <Typography variant="body" muted>
                Yes. Every extracted frame preserves the exact pixel width and height of your source video without cropping.
              </Typography>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SideNav />
    </div>
  );
}
