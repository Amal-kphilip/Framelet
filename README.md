# Framelet

> Extract high-quality still frames from short videos directly in your browser.

[![License: MIT](https://img.shields.io/github/license/Amal-kphilip/Framelet)](LICENSE)
[![CI](https://github.com/Amal-kphilip/Framelet/actions/workflows/ci.yml/badge.svg)](https://github.com/Amal-kphilip/Framelet/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/Amal-kphilip/Framelet)](https://github.com/Amal-kphilip/Framelet/releases)
[![Last Commit](https://img.shields.io/github/last-commit/Amal-kphilip/Framelet)](https://github.com/Amal-kphilip/Framelet/commits/main)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<!-- TODO: Add live demo URL once deployed -->
**Live Demo:** _Coming soon (TODO: add deployment link)_

<!-- TODO: Add screenshot or demo GIF of Framelet in action -->
<!-- ![Framelet Demo](docs/assets/demo.gif) -->

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Configuration & Guardrails](#configuration--guardrails)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Features

- **Client-side Canvas extraction**: Processes video frames in browser memory without uploading video files to an application server.
- **Multiple video containers**: Accepts MP4, WebM, MOV, MKV, and AVI files (actual playback/decoding depends on your browser's installed codecs).
- **Flexible capture modes**: Extract by time interval, frames per second (FPS), or custom frame count with presets and synchronized frame-count estimates.
- **Format & quality control**: Export JPEG, PNG, or WebP images when supported by the browser's Canvas `toBlob()` encoder; reports an error instead of silently falling back to a mismatched MIME type.
- **Individual & ZIP exports**: Download individual frames or export selected/all frames as a ZIP archive with a `metadata.json` manifest (source filename, MIME type, timestamps, dimensions, byte sizes, and counts).
- **Paginated gallery**: Search by frame number or timestamp, filter by selection state, sort by timestamp or file size, and browse 48 frames per page.
- **Reliability & safety guardrails**: Enforces a 90-second source-video limit, a 500-frame extraction cap, a 512 MiB approximate output guardrail, extraction cancellation, media-event timeouts, and object-URL cleanup.
- **Accessible editorial UI**: Keyboard focus styles, modal focus management, Escape-to-close, `prefers-reduced-motion` support, and security response headers via `next.config.mjs`.

> **Note on FFmpeg.wasm**: An optional `ffmpeg.ts` helper exists in `src/lib/` separate from the active UI workflow. If explicitly invoked by a developer, it loads FFmpeg core from a CDN; the default UI path uses the browser-native Canvas engine only.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling & Motion**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Client-side Export**: [JSZip](https://stuk.github.io/jszip/), [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- **Tooling & Testing**: [Vitest](https://vitest.dev/), [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/), [commitlint](https://commitlint.js.org/)

---

## Getting Started

### Prerequisites

- **Node.js 22+** (see [`.nvmrc`](.nvmrc))
- **npm** (included with Node.js)
- A modern browser with HTML5 video decoding and Canvas `toBlob()` support

### Installation

```bash
git clone https://github.com/Amal-kphilip/Framelet.git
cd Framelet
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command                | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Start the Next.js development server (Webpack)                |
| `npm run build`        | Build the production application (Webpack)                    |
| `npm run start`        | Serve the production build                                    |
| `npm run lint`         | Run ESLint across the repository                              |
| `npm run format`       | Format files with Prettier                                    |
| `npm run format:check` | Check formatting with Prettier                                |
| `npm run typecheck`    | Run TypeScript compiler checks (`tsc --noEmit`)               |
| `npm test`             | Run unit tests once with Vitest                               |
| `npm run test:watch`   | Run Vitest in watch mode                                      |
| `npm run check`        | Run `lint`, `format:check`, `typecheck`, `test`, and `build`  |

---

## Project Structure

```text
.
├── .github/                  # Issue/PR templates, CODEOWNERS, Dependabot, workflows
├── docs/                     # Design and engineering notes
├── public/                   # Static assets, icons, and fonts
├── src/
│   ├── app/                  # Next.js App Router pages, layout, global styles
│   ├── components/           # UI components (upload zone, controls, gallery, modal)
│   ├── lib/                  # Frame extraction, timestamp math, ZIP export, tests
│   └── types/                # Shared TypeScript interfaces
├── next.config.mjs           # Next.js config and security headers
├── eslint.config.mjs         # ESLint 9 flat configuration
├── vitest.config.ts          # Vitest configuration
└── package.json              # Dependencies, scripts, and lint-staged config
```

---

## Configuration & Guardrails

Framelet requires no environment variables to run locally or in production.

Key application guardrails defined in [`src/lib/videoUtils.ts`](src/lib/videoUtils.ts):

- `MAX_ALLOWED_DURATION_SECONDS = 90` — maximum source video duration
- `MAX_EXTRACTED_FRAMES = 500` — maximum frames per extraction run
- `MAX_ESTIMATED_OUTPUT_BYTES = 512 MiB` — soft approximate output/export guardrail
- `VIDEO_METADATA_TIMEOUT_MS = 20000` — timeout for browser metadata loading

Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) are configured in [`next.config.mjs`](next.config.mjs).

---

## Testing

Unit tests use [Vitest](https://vitest.dev/) and live alongside the utilities in `src/lib/__tests__/`:

```bash
npm test
```

Run the full CI-equivalent verification locally:

```bash
npm run check
```

---

## Roadmap

- [ ] Add live deployment URL and visual demo GIF
- [ ] Expand unit test coverage for ZIP metadata manifest generation
- [ ] Optional end-to-end browser tests for extraction and export flows

---

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md), follow the [Code of Conduct](CODE_OF_CONDUCT.md), and report security issues privately via [SECURITY.md](SECURITY.md).

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- [JSZip](https://stuk.github.io/jszip/) and [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [Lucide Icons](https://lucide.dev/) and [Framer Motion](https://www.framer.com/motion/)
