import { describe, expect, it } from "vitest";
import { calculateGaugeLevel, middleTruncate } from "../uiHelpers";
import { MAX_ESTIMATED_OUTPUT_BYTES } from "../videoUtils";

describe("middleTruncate", () => {
  it("returns original string when within maxLength", () => {
    expect(middleTruncate("short.mp4", 30)).toBe("short.mp4");
    expect(middleTruncate("", 30)).toBe("");
  });

  it("truncates long filenames in the middle preserving start and extension", () => {
    const input = "very_long_screen_recording_from_vacation_2026_4k.mp4";
    const result = middleTruncate(input, 28);
    expect(result.length).toBe(28);
    expect(result).toContain("…");
    expect(result.startsWith("very_long_")).toBe(true);
    expect(result.endsWith(".mp4")).toBe(true);
  });

  it("handles tiny maxLength safely", () => {
    expect(middleTruncate("abcdef", 3)).toBe("abc");
  });
});

describe("calculateGaugeLevel", () => {
  it("returns safe for zero, invalid, or low byte estimates", () => {
    expect(calculateGaugeLevel(0)).toEqual({ percent: 0, level: "safe" });
    expect(calculateGaugeLevel(Number.NaN)).toEqual({ percent: 0, level: "safe" });
    expect(calculateGaugeLevel(MAX_ESTIMATED_OUTPUT_BYTES * 0.25)).toEqual({
      percent: 25,
      level: "safe",
    });
  });

  it("returns warning between 70% and 95%", () => {
    expect(calculateGaugeLevel(MAX_ESTIMATED_OUTPUT_BYTES * 0.7)).toEqual({
      percent: 70,
      level: "warning",
    });
    expect(calculateGaugeLevel(MAX_ESTIMATED_OUTPUT_BYTES * 0.85)).toEqual({
      percent: 85,
      level: "warning",
    });
  });

  it("returns danger at or above 95% and clamps percent to 100", () => {
    expect(calculateGaugeLevel(MAX_ESTIMATED_OUTPUT_BYTES * 0.96)).toEqual({
      percent: 96,
      level: "danger",
    });
    expect(calculateGaugeLevel(MAX_ESTIMATED_OUTPUT_BYTES * 1.5)).toEqual({
      percent: 100,
      level: "danger",
    });
  });
});
