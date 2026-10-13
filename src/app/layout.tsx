import type { Metadata } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/AmbientBackground";

export const metadata: Metadata = {
  metadataBase: new URL("https://framelet.vercel.app"),
  title: "Framelet | Video Frame Extractor",
  applicationName: "Framelet",
  description: "Extract still frames from short videos in your browser. Choose capture intervals, select frames, and export JPEG, PNG, WebP, or ZIP files locally.",
  openGraph: {
    title: "Framelet | Video Frame Extractor",
    description: "Extract and export video frames locally in your browser with precise capture controls and a searchable gallery.",
    siteName: "Framelet",
    type: "website",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Framelet app icon" }],
  },
  twitter: {
    card: "summary",
    title: "Framelet | Video Frame Extractor",
    description: "Extract and export video frames locally in your browser.",
    images: ["/icon.png"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen relative selection:bg-orange-500/30 selection:text-white">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
