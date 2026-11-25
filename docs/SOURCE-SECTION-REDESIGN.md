# Source section UI update

The loaded-video/source panel now has a more deliberate preview and metadata hierarchy.

- Replaced the flat black preview backdrop with an ambient orange/wine monitor stage so portrait videos feel intentionally framed in a wide workspace.
- Added source-monitor and resolution badges plus decorative film markings.
- Added an accessible, functional preview scrubber tied to the active video element.
- Made the selected filename wrap to two lines rather than being cut off immediately, and surfaced file type and size in the source heading.
- Improved metadata tiles with icons, short explanations, hover feedback, and orange accent rails.
- Added a clear “Configure capture” action that scrolls to the extraction-settings section.
- Added restrained preview glow and readiness animations with reduced-motion support.

No extraction engine, timestamp generation, output format, or download behavior was changed.

## Checks

- `npm run test`: 7/7 tests pass.
- `npm run typecheck`: passes.
- `npm run lint`: passes.
- `npm run build`: could not run in the Linux packaging environment because the installed dependency directory did not include the Linux SWC binary. The user's Windows environment should run `npm run build` after copying and installing dependencies.
