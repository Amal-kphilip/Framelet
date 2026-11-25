# Framelet fixes applied

This package repairs the errors shown in the supplied PowerShell log.

## Fixed

## Full-bleed layout correction

- Removed the outer page padding so the website reaches the viewport edges on the top, left, and right.
- Removed the centered 1180px maximum-width constraint that made the entire page look like a boxed card.
- Removed the shell border, rounding, and shadow; the page is now a full-width canvas instead of a square/rounded container.
- Removed inner wrapper padding from the hero and benefits strip so their backgrounds span the viewport.
- Applied horizontal spacing only to the workspace and supporting content, where it improves readability, while the outer canvas remains flush to the edges.
- Kept the reference-inspired rounded lower corners on the hero/proof sections only; mobile layout no longer adds outer gutters.


- Removed React state updates from `FrameGallery` effects. Filter/search/sort events reset pagination directly, and the displayed page is derived safely when selection changes shrink the results.
- Removed the render-time mutation of `onCloseRef.current` in `FramePreviewModal`; the ref is updated in an effect.
- Removed legacy `.eslintignore` and `.eslintrc.json` files. `eslint.config.mjs` is the single active flat configuration and ignores generated output.
- Updated `dev` and `build` scripts to call Next.js through Node and explicitly use Webpack, so Next.js 16 does not implicitly select Turbopack while the project still has a Webpack config.
- Aligned `package.json` with the versions in the uploaded installed dependency tree (Next.js 16.4.0, React 19.3.0, ESLint 9.39.5, Tailwind CSS 3.4.19, etc.) and regenerated the npm lockfile from the available tree.
- Removed generated `.next` type imports from the baseline `next-env.d.ts` so a clean project can run typecheck before `.next` is generated.

## Checks run

- `npm run check`: passed (7 tests, TypeScript, ESLint).
- `npm ls --depth=0`: passed for direct dependencies.
- `npm run dev`: Next.js starts with Webpack and no webpack/Turbopack configuration conflict.

A production build could not be completed in the Linux sandbox because the matching `@next/swc-linux-x64-gnu` binary was not included in the Windows-installed dependency tree and the sandbox could not access the npm registry to fetch it. This does not verify or falsify a Windows production build.

## After copying to Windows

Run from `C:\\My Projects\\Frame-Extracter`:

```powershell
npm install
npm run check
npm run dev
```

Before deployment, also run `npm run build`. If npm updates `package-lock.json` during install, keep the updated lockfile with the project so CI/deployment uses the resolved dependency tree for all supported platforms.
