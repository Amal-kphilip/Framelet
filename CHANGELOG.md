# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Repository standards: MIT `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.editorconfig`, issue/PR templates, and `CODEOWNERS`.
- Prettier formatting, `eslint-config-prettier`, Husky + `lint-staged`, `commitlint` (Conventional Commits), and Vitest unit test suite.
- GitHub Actions workflows for CI, CodeQL, Release Please, stale management, PR labeling, first-time contributor welcome, and Dependabot.

### Changed

- Moved working notes and UI redesign logs into `docs/`.
- Overhauled `README.md` with badges, project structure, and developer documentation.

## [1.0.0] - 2026-11-25

### Added

- Initial release of Framelet, a browser-native Next.js, React, and TypeScript video frame extractor.
- Canvas-based frame extraction with interval, FPS, and custom-count modes.
- JPEG, PNG, and WebP output with browser codec/encoding verification and safety limits (90s source limit, 500-frame limit, 512 MiB output guardrail).
- Paginated frame gallery with search, filtering, sorting, individual downloads, and ZIP export with `metadata.json`.
- Full-bleed editorial UI, accessible controls, reduced-motion support, and security response headers in `next.config.mjs`.
