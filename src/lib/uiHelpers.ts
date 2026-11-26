import { MAX_ESTIMATED_OUTPUT_BYTES } from "./videoUtils";

export type GaugeLevel = "safe" | "warning" | "danger";

export interface GaugeStatus {
  percent: number;
  level: GaugeLevel;
}

/**
 * Truncates long strings (such as filenames) in the middle so both the start
 * and file extension remain readable.
 */
export function middleTruncate(text: string, maxLength = 34): string {
  if (!text) return "";
  if (maxLength < 5) return text.slice(0, Math.max(0, maxLength));
  if (text.length <= maxLength) return text;

  const ellipsis = "…";
  const available = maxLength - ellipsis.length;
  const frontChars = Math.ceil(available * 0.58);
  const backChars = Math.floor(available * 0.42);

  return `${text.slice(0, frontChars)}${ellipsis}${text.slice(text.length - backChars)}`;
}

/**
 * Computes a display-only percentage and severity level against the 512 MiB
 * output safety guardrail.
 */
export function calculateGaugeLevel(
  estimatedBytes: number,
  maxBytes: number = MAX_ESTIMATED_OUTPUT_BYTES
): GaugeStatus {
  if (
    !Number.isFinite(estimatedBytes) ||
    estimatedBytes <= 0 ||
    !Number.isFinite(maxBytes) ||
    maxBytes <= 0
  ) {
    return { percent: 0, level: "safe" };
  }

  const rawPercent = (estimatedBytes / maxBytes) * 100;
  const percent = Math.min(100, Math.max(0, Math.round(rawPercent * 10) / 10));

  if (rawPercent >= 95) {
    return { percent, level: "danger" };
  }
  if (rawPercent >= 70) {
    return { percent, level: "warning" };
  }
  return { percent, level: "safe" };
}
