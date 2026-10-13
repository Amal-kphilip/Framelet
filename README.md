# Framelet — Video Frame Extractor

Framelet is a Next.js, React, and TypeScript web application for extracting still frames from short videos in the browser. It uses a full-bleed editorial layout with a cinematic orange-red hero, a matte-black workspace, and warm accent details while focusing on reliable extraction, accurate file naming, bounded gallery rendering, and accessible controls.

## Features

- Browser-native Canvas frame extraction; the active workflow does not upload the selected video to an application server.
- MP4, WebM, MOV, MKV, and AVI file selection, with actual compatibility determined by the browser's installed media decoders.
- A 90-second source-video limit and a 500-frame-per-extraction safety limit and a 512 MiB approximate-output / ZIP-export guardrail to reduce browser memory spikes.
- Interval and FPS capture-rate modes, common presets, and synchronized frame-count estimates.
- JPEG, PNG, and WebP output when the browser supports the requested canvas encoding. If a format is unsupported, extraction reports an error rather than silently saving a differently encoded image with a misleading extension.
- Individual frame downloads and ZIP exports whose file extensions match the actual image MIME type.
- ZIP `metadata.json` manifest with original video name, image type, timestamps, dimensions, byte sizes, and selected/exported counts.
- Extraction cancellation, timeouts for browser media events, stale-result protection, and object-URL cleanup.
- Search by frame number or timestamp, filter by selection state, sort by timestamp or file size, and paginated gallery rendering (48 frames per page).
- Keyboard focus styles, accessible labels, modal focus management, Escape-to-close, reduced-motion support, and lighter glass blur on mobile.
- Security-related response headers via `next.config.mjs`.

## Requirements

- Node.js 18.17+ (Node.js 20 LTS or newer is recommended).
- A modern browser with support for the selected video codec and Canvas `toBlob()` encoding for the chosen image format.

File extensions alone do not guarantee that a video can be decoded. Compatibility varies by operating system, browser, and codec profile.

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the automated checks:

```bash
npm run check
```

This executes the frame-timestamp utility tests, TypeScript type checking, and ESLint. You can also run individual checks with `npm test`, `npm run typecheck`, and `npm run lint`.

Create and run a production build:

```bash
npm run build
npm run start
```

## Extraction and privacy notes

The normal UI uses the browser-native Canvas engine. Video files and generated frames remain in browser memory unless the user chooses to download an image or ZIP. The UI does not send video content to an application upload endpoint. Browser assets and npm dependencies are still loaded as normal web resources.

The optional FFmpeg.wasm helper remains separate from the active UI workflow. It loads its FFmpeg core from the configured CDN if a developer explicitly uses that helper; the default path does not initialize it. The default engine is not described as guaranteed hardware-accelerated or zero-lag because performance depends on browser, device, codec, and video resolution.

Output-size estimates are approximate and can differ materially with image content and compression settings. The 500-frame limit and 512 MiB rough-output/selected-image guardrail reduce the chance of excessive browser memory use. Estimates are not exact; actual encoded sizes depend on frame content. Users can increase the interval, lower FPS, choose a more compact format, or export selected frames in smaller batches.

## Tech stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- Framer Motion and Lucide React
- Browser Canvas / HTML video decoding
- JSZip and FileSaver.js for client-side export
- Node.js built-in test runner for utility regression tests
