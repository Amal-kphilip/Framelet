import { describe, expect, it } from "vitest";
import {
  MAX_EXTRACTED_FRAMES,
  buildFrameTimestamps,
  estimateOutputBytes,
  formatBytes,
  formatDuration,
  formatDurationSimple,
  getAspectRatio,
} from "../videoUtils";
import type { ExtractionSettings } from "@/types";

const baseSettings: ExtractionSettings = {
  mode: "interval",
  fps: 1,
  interval: 1,
  format: "image/jpeg",
  quality: 0.92,
};

describe("buildFrameTimestamps", () => {
  it("begins at zero and includes a final near-end frame when appropriate", () => {
    const timestamps = buildFrameTimestamps(4.7, baseSettings);
    expect(timestamps[0]).toBe(0);
    expect(timestamps.every((time) => time >= 0 && time < 4.7)).toBe(true);
    expect(timestamps[timestamps.length - 1]).toBeGreaterThan(4.5);
  });

  it("stays in sync with generated timestamps for dense extraction", () => {
    const timestamps = buildFrameTimestamps(90, { ...baseSettings, interval: 0.1 });
    expect(timestamps).toHaveLength(900);
    expect(timestamps.length).toBeGreaterThan(MAX_EXTRACTED_FRAMES);
    expect(timestamps.every((time) => time < 90)).toBe(true);
  });

  it("uses the reciprocal FPS interval in FPS mode", () => {
    const timestamps = buildFrameTimestamps(5, { ...baseSettings, mode: "fps", fps: 2 });
    expect(timestamps[0]).toBe(0);
    expect(timestamps.some((time) => Math.abs(time - 0.5) < 0.0001)).toBe(true);
  });

  it("returns the requested count evenly spaced before end-of-file in custom-count mode", () => {
    const timestamps = buildFrameTimestamps(10, {
      ...baseSettings,
      mode: "custom_count",
      maxFrames: 5,
    });
    expect(timestamps).toHaveLength(5);
    expect(timestamps[0]).toBe(0);
    expect(timestamps[4]).toBeLessThan(10);
    expect(timestamps[4]).toBeGreaterThan(9.9);
  });

  it("produces no timestamps for invalid or zero duration", () => {
    expect(buildFrameTimestamps(0, baseSettings)).toEqual([]);
    expect(buildFrameTimestamps(Number.NaN, baseSettings)).toEqual([]);
  });
});

describe("formatDuration", () => {
  it("handles zero and invalid values explicitly", () => {
    expect(formatDuration(0)).toBe("00:00.00");
    expect(formatDuration(61.239)).toBe("01:01.23");
    expect(formatDuration(Number.NaN)).toBe("00:00.00");
  });
});

describe("formatDurationSimple", () => {
  it("formats minutes and seconds without centiseconds", () => {
    expect(formatDurationSimple(0)).toBe("00:00");
    expect(formatDurationSimple(65.9)).toBe("01:05");
    expect(formatDurationSimple(-5)).toBe("00:00");
  });
});

describe("formatBytes", () => {
  it("handles invalid and zero values safely", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
    expect(formatBytes(Number.NaN)).toBe("0 Bytes");
    expect(formatBytes(1024)).toMatch(/1 KB/);
  });
});

describe("getAspectRatio", () => {
  it("identifies common ratios and handles invalid dimensions", () => {
    expect(getAspectRatio(1920, 1080)).toBe("16:9");
    expect(getAspectRatio(1080, 1920)).toBe("9:16 (Vertical)");
    expect(getAspectRatio(1080, 1080)).toBe("1:1 (Square)");
    expect(getAspectRatio(0, 1080)).toBe("Unknown");
  });
});

describe("estimateOutputBytes", () => {
  it("scales proportionally with frame count, dimensions, and format", () => {
    const jpegBytes = estimateOutputBytes(10, 1920, 1080, baseSettings);
    const pngBytes = estimateOutputBytes(10, 1920, 1080, {
      ...baseSettings,
      format: "image/png",
    });
    expect(jpegBytes).toBeGreaterThan(0);
    expect(pngBytes).toBeGreaterThan(jpegBytes);
    expect(estimateOutputBytes(0, 1920, 1080, baseSettings)).toBe(0);
  });
});
