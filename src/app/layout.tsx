import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";

const displayFont = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["700", "800"],
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0d",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://framelet.vercel.app"),
  title: "Framelet | Frame Extractor",
  applicationName: "Framelet",
  description:
    "Extract still frames from videos directly in your browser. Choose capture intervals, select frames, and export JPEG, PNG, WebP, or ZIP files locally with no uploads.",
  openGraph: {
    title: "Framelet | Frame Extractor",
    description:
      "Extract and export video frames locally in your browser with precise capture controls and zero file uploads.",
    siteName: "Framelet",
    type: "website",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "Framelet app icon" }],
  },
  twitter: {
    card: "summary",
    title: "Framelet | Frame Extractor",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${displayFont.variable} ${sansFont.variable}`}
    >
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen flex flex-col font-sans bg-background text-foreground"
      >
        <ThemeProvider>
          <ScrollProgressBar />
          <div className="flex flex-col flex-1 w-full overflow-x-hidden">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
