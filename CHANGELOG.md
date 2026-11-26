# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0](https://github.com/Amal-kphilip/Framelet/compare/v1.3.0...v1.4.0) (2026-11-26)


### Features

* redesign workspace ([#27](https://github.com/Amal-kphilip/Framelet/issues/27)) ([22ac03a](https://github.com/Amal-kphilip/Framelet/commit/22ac03afe8c87c7e11a41e0265d7f542b5f823f4))

## [1.3.0](https://github.com/Amal-kphilip/Framelet/compare/v1.2.0...v1.3.0) (2026-11-26)


### Features

* **landing:** add hero, marquee, features, how-it-works, and FAQ sections ([#25](https://github.com/Amal-kphilip/Framelet/issues/25)) ([859b4bb](https://github.com/Amal-kphilip/Framelet/commit/859b4bbffbb5110639baf40c3e0ba8ceec4afd7e))

## [1.2.0](https://github.com/Amal-kphilip/Framelet/compare/v1.1.0...v1.2.0) (2026-11-26)


### Features

* redesign foundation ([#23](https://github.com/Amal-kphilip/Framelet/issues/23)) ([f9d19ae](https://github.com/Amal-kphilip/Framelet/commit/f9d19aea2938ac38ea127eac5f6858d191b8aef8))

## [1.1.0](https://github.com/Amal-kphilip/Framelet/compare/v1.0.1...v1.1.0) (2026-11-26)


### Features

* add frame capture, trim range, resolution scale and filename templates ([#20](https://github.com/Amal-kphilip/Framelet/issues/20)) ([9aff4e7](https://github.com/Amal-kphilip/Framelet/commit/9aff4e764a49d998d164bb74f9a8766717d54e8b))

## [1.0.1](https://github.com/Amal-kphilip/Framelet/compare/v1.0.0...v1.0.1) (2026-11-26)


### Bug Fixes

* **deps:** regenerate package-lock.json ([#12](https://github.com/Amal-kphilip/Framelet/issues/12)) ([c3ebc2b](https://github.com/Amal-kphilip/Framelet/commit/c3ebc2badc491da66612a31af3938a82465b0aab))

## 1.0.0 (2026-11-25)


### Features

* initial commit for Framelet ([8ffce75](https://github.com/Amal-kphilip/Framelet/commit/8ffce75dce7073d71425656fc6163363fbaaa9b4))
* overall improvements ([cdaa861](https://github.com/Amal-kphilip/Framelet/commit/cdaa8615d3516169eaea61d7d66d1f6f12b24466))
* redesign ui to clean lag-free flat design ([f8ff8f3](https://github.com/Amal-kphilip/Framelet/commit/f8ff8f337240122886b4461fbfdd704b9ef1fd6f))
* render original aspect ratio & double click expand ([10e1279](https://github.com/Amal-kphilip/Framelet/commit/10e12796cae1806cdbc733e7c160eec6006a608b))


### Bug Fixes

* **deps:** upgrade next and eslint-config-next to 16.4.6 ([#2](https://github.com/Amal-kphilip/Framelet/issues/2)) ([f415b95](https://github.com/Amal-kphilip/Framelet/commit/f415b95708e4fe4e26db37d8ad7eb102efecc81d))
* frames extracted to zip root, no nested folder ([fcd84f7](https://github.com/Amal-kphilip/Framelet/commit/fcd84f7fccd4f0e3a651ea067268f97922a7e799))
* prevent header brand text overlap on mobile ([f344be4](https://github.com/Amal-kphilip/Framelet/commit/f344be4d9d60e885e3c99b9ee5e06d836272092e))
* resolve all mobile layout overflow and wrapping bugs ([d3dd865](https://github.com/Amal-kphilip/Framelet/commit/d3dd86595c86937756f1d06d10d3018a06c06b72))
* toast tap to dismiss, auto dismiss timer & mobile safe area padding ([2098bce](https://github.com/Amal-kphilip/Framelet/commit/2098bce6434a48eb4e53a2528adfb692a5979b46))

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
