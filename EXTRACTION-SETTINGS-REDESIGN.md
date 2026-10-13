# Framelet Extraction Settings UI Update

This update redesigns the extraction settings panel without changing the video extraction callbacks or export implementation.

## UI changes

- Editorial settings header with clearer step label and live estimate cards.
- Dedicated capture-rate and output-format cards with consistent warm accent styling.
- Accessible interval/FPS segmented control and custom visual range tracks.
- Quick presets show a short use case, interval, and estimated frame count.
- Sampling ruler visualizes capture density for the selected setting.
- Output formats are now prominent selectable cards, including extension and concise format guidance.
- Quality control communicates the selected quality level and explains when PNG ignores lossy quality.
- Export summary shows frame count, chosen format, and actual output dimensions immediately above the extraction action.
- Fixed the safety-limit warning so it also appears when the estimated output size (not just frame count) exceeds its budget.
- Responsive single-column layout for tablet and mobile, with smaller cards on narrow screens.
- Keyboard focus and reduced-motion behavior included for the new interactive details.

## Verification performed

- `npm run test`: 7 passing tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- CSS parsed using PostCSS.

## Build limitation

`npm run build` was attempted with Webpack. It could not finish in this Linux environment because the Linux Next.js SWC compiler binary was not installed and the npm registry could not be reached (`EAI_AGAIN registry.npmjs.org`). Run `npm run build` on the target Windows system after `npm install` to verify the local production build.
