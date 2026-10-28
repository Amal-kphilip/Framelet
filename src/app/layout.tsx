import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const avenirNext = localFont({
  variable: "--font-avenir",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/avenir-next-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/avenir-next-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/avenir-next-demibold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`antialiased min-h-screen flex flex-col ${avenirNext.variable} font-avenir bg-background text-foreground`}
      >
        <ThemeProvider>
          <div className="flex flex-col flex-1 items-center">
            <div className="max-w-[var(--max-content-width)] flex flex-col flex-1 w-full h-full px-[var(--space-xl)]">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
