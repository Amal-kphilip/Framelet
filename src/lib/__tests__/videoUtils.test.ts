import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILENAME_TEMPLATE,
  MAX_EXTRACTED_FRAMES,
  buildFrameTimestamps,
  calculateScaledDimensions,
  estimateOutputBytes,
  formatBytes,
  formatDuration,
  formatDurationSimple,
  formatFrameFilename,
  getAspectRatio,
  hasDuplicateTimestamp,
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

  it("respects trimStart and trimEnd range and handles edge cases", () => {
    const ranged = buildFrameTimestamps(10, { ...baseSettings, trimStart: 2, trimEnd: 5 });
    expect(ranged[0]).toBe(2);
    expect(ranged.every((t) => t >= 2 && t < 5)).toBe(true);
    expect(ranged[ranged.length - 1]).toBeGreaterThan(4.9);

    expect(buildFrameTimestamps(10, { ...baseSettings, trimStart: 5, trimEnd: 5 })).toEqual([]);
    expect(buildFrameTimestamps(10, { ...baseSettings, trimStart: 6, trimEnd: 4 })).toEqual([]);

    const clamped = buildFrameTimestamps(8, { ...baseSettings, trimStart: -2, trimEnd: 15 });
    expect(clamped[0]).toBe(0);
    expect(clamped.every((t) => t >= 0 && t < 8)).toBe(true);
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

describe("calculateScaledDimensions", () => {
  it("preserves aspect ratio when downscaling and never upscales", () => {
    expect(calculateScaledDimensions(3840, 2160, "original")).toEqual({
      width: 3840,
      height: 2160,
    });
    expect(calculateScaledDimensions(3840, 2160, "1080p")).toEqual({ width: 1920, height: 1080 });
    expect(calculateScaledDimensions(3840, 2160, "720p")).toEqual({ width: 1280, height: 720 });
    expect(calculateScaledDimensions(1280, 720, "1080p")).toEqual({ width: 1280, height: 720 });
    expect(calculateScaledDimensions(640, 480, "720p")).toEqual({ width: 640, height: 480 });
    expect(calculateScaledDimensions(1080, 1920, "1080p")).toEqual({ width: 608, height: 1080 });
  });
});

describe("formatFrameFilename", () => {
  it("renders default and custom templates and sanitizes illegal characters", () => {
    const defaultName = formatFrameFilename(DEFAULT_FILENAME_TEMPLATE, {
      baseName: "my:video*clip.mp4",
      index: 3,
      formattedTime: "00:01.25",
      width: 1920,
      height: 1080,
      extension: "jpg",
    });
    expect(defaultName).toBe("my_video_clip_frame_0003_00m01s25.jpg");

    const customName = formatFrameFilename("{name}/{width}x{height}_{index}_{timestamp}", {
      baseName: "demo.mov",
      index: 12,
      formattedTime: "01:05.00",
      width: 1280,
      height: 720,
      extension: "png",
    });
    expect(customName).toBe("demo_1280x720_0012_01m05s00.png");
  });
});

describe("hasDuplicateTimestamp", () => {
  it("detects duplicate timestamps within epsilon tolerance", () => {
    const frames = [{ timestamp: 1.0 }, { timestamp: 2.5 }];
    expect(hasDuplicateTimestamp(frames, 1.0)).toBe(true);
    expect(hasDuplicateTimestamp(frames, 1.005)).toBe(true);
    expect(hasDuplicateTimestamp(frames, 1.5)).toBe(false);
  });
});
