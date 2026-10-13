const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

// Load the TypeScript utility directly so these fast unit tests need no browser or extra test framework.
const sourcePath = path.resolve(__dirname, '../src/lib/videoUtils.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = new Module(sourcePath, module);
compiledModule.filename = sourcePath;
compiledModule.paths = Module._nodeModulePaths(path.dirname(sourcePath));
compiledModule._compile(transpiled, sourcePath);
const { buildFrameTimestamps, formatDuration, formatBytes, MAX_EXTRACTED_FRAMES } = compiledModule.exports;

const baseSettings = { mode: 'interval', fps: 1, interval: 1, format: 'image/jpeg', quality: 0.92 };

test('interval extraction begins at zero and includes a final near-end frame when appropriate', () => {
  const timestamps = buildFrameTimestamps(4.7, baseSettings);
  assert.equal(timestamps[0], 0);
  assert.ok(timestamps.every((time) => time >= 0 && time < 4.7));
  assert.ok(timestamps[timestamps.length - 1] > 4.5);
});

test('frame timestamp estimate stays in sync with generated timestamps for dense extraction', () => {
  const timestamps = buildFrameTimestamps(90, { ...baseSettings, interval: 0.1 });
  assert.equal(timestamps.length, 900);
  assert.ok(timestamps.length > MAX_EXTRACTED_FRAMES);
  assert.ok(timestamps.every((time) => time < 90));
});

test('FPS mode uses the reciprocal FPS interval', () => {
  const timestamps = buildFrameTimestamps(5, { ...baseSettings, mode: 'fps', fps: 2 });
  assert.equal(timestamps[0], 0);
  assert.ok(timestamps.some((time) => Math.abs(time - 0.5) < 0.0001));
});

test('custom-count mode returns the requested count evenly spaced before end-of-file', () => {
  const timestamps = buildFrameTimestamps(10, { ...baseSettings, mode: 'custom_count', maxFrames: 5 });
  assert.equal(timestamps.length, 5);
  assert.equal(timestamps[0], 0);
  assert.ok(timestamps[4] < 10 && timestamps[4] > 9.9);
});

test('invalid or zero duration produces no timestamps', () => {
  assert.deepEqual(buildFrameTimestamps(0, baseSettings), []);
  assert.deepEqual(buildFrameTimestamps(Number.NaN, baseSettings), []);
});

test('duration formatter handles zero and invalid values explicitly', () => {
  assert.equal(formatDuration(0), '00:00.00');
  assert.equal(formatDuration(61.239), '01:01.23');
  assert.equal(formatDuration(Number.NaN), '00:00.00');
});

test('byte formatter handles invalid and zero values safely', () => {
  assert.equal(formatBytes(0), '0 Bytes');
  assert.equal(formatBytes(Number.NaN), '0 Bytes');
  assert.match(formatBytes(1024), /1 KB/);
});
