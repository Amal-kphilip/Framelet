import type { Metadata } from "next";
import "./globals.css";
import { AmbientBackground } from "@/components/AmbientBackground";

export const metadata: Metadata = {
  title: "Framelet | Frame Extractor",
  description: "High-performance client-side video frame extraction with Apple liquid glass aesthetics and zero upload wait times.",
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
      <body className="antialiased bg-[#08080a] text-foreground min-h-screen relative selection:bg-sky-500/30 selection:text-sky-200">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
