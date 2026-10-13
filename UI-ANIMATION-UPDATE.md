# Framelet UI update: upload and extraction experience

## What changed

- Reworked the idle upload drop zone into a wide, responsive two-column experience with an animated film/viewfinder illustration, animated sample frames, local-processing cues, an active drag/drop state, and a visible video-analysis state.
- Reworked the loaded-video summary into a structured source panel with preview controls, metadata tiles, source state and local-processing reassurance.
- Improved the extraction settings hierarchy, animated in the metric/settings panels, clarified the capture estimate cards, and refined the primary extraction action.
- Replaced the previous generic progress card with a multi-stage capture display, circular progress dial, frame counter, animated scan highlight and explicit local-processing status.
- Added responsive rules and reduced-motion handling for the new animations.

## Kept unchanged

- The extraction engine and its callbacks.
- Frame timestamp generation and extraction settings behavior.
- Image selection and preview behavior.
- Image and ZIP export behavior.

## Validation performed

- `npm run check`: passed (7 tests, TypeScript, ESLint).
- CSS parser check: passed.
- Browser-level visual verification and a production build were not completed in this environment because the available Next.js installation lacks the Linux SWC binary and the environment could not download it. Run `npm install`, `npm run check`, and `npm run build` on Windows before deployment.
