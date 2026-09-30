# Framelet 🎬✨

An Apple-inspired, high-performance web application designed to extract pristine high-resolution frames from videos directly inside the client browser. Features a **"Liquid Glass" & Glassmorphism aesthetic**, hardware-accelerated zero-lag frame extraction, multi-selection gallery, and instant ZIP downloads.

---

## 🌟 Key Features

- **Apple "Liquid Glass" Aesthetic**:
  - Deep `#08080A` background with ambient moving blurred liquid glowing orbs powered by Framer Motion.
  - Frosted glass cards with `backdrop-filter: blur(24px)`, subtle white borders (`border-white/15`), tactile hover lift effects, and soft drop shadows.
  - Apple Dock-style floating glassmorphic action bar.

- **100% Client-Side Video Processing (Zero-Lag)**:
  - Videos never leave your browser—zero upload or download wait times.
  - Full original resolution extraction preserving every pixel (1080p, 4K, 8K).
  - Dual extraction engine: WebAssembly **FFmpeg.wasm** + Hardware-Accelerated High-Speed Canvas Engine.

- **Video Upload Zone & Strict Validation**:
  - Drag-and-drop zone supporting `MP4`, `WebM`, `MOV`, and `MKV`.
  - Strict 90-second max duration validation with graceful error toast alerts.
  - Sleek integrated HTML5 video player with resolution, aspect ratio, file size, and duration badges.

- **Extraction Tuning Controls**:
  - Extraction interval slider (e.g., every 0.1s up to 5.0s) & FPS selector.
  - Quick presets: *Ultra Dense (0.2s)*, *High Detail (0.5s)*, *Standard (1.0s)*, *Sparse (2.0s)*, *Milestones (5.0s)*.
  - Live estimated frame count calculator.
  - Format selector (`JPEG`, `PNG Lossless`, `WebP`) and compression quality sliders.

- **Fluid Liquid Progress Bar**:
  - Shimmering liquid glass progress bar with glowing tip and live percentage counter.

- **Interactive Masonry Frame Gallery**:
  - Responsive CSS Grid masonry layout.
  - Click to select/deselect with glowing checkmark rings and border highlights.
  - Batch actions: **Select All**, **Deselect All**, and **Invert Selection**.
  - Frame Lightbox Inspector Modal for zooming, metadata inspection, clipboard copy, and individual frame saving.

- **Floating Action Bar & ZIP Bundling**:
  - Floating bottom dock displaying live selection count.
  - Bundles selected frames via **JSZip** with custom timestamp filenames and JSON manifest metadata.
  - Celebratory confetti burst upon download completion.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS & Custom Glassmorphic Utilities
- **Motion & Physics**: Framer Motion
- **Core Processing Engine**: FFmpeg.wasm & Hardware Canvas Decoders
- **Packaging & Downloads**: JSZip, FileSaver.js, Canvas Confetti
- **Icons**: Lucide React
