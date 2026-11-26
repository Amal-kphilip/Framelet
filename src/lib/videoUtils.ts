import { ExtractedFrame, ExtractionSettings, ResolutionScale, VideoMetadata } from "@/types";

export const MAX_ALLOWED_DURATION_SECONDS = 90;
export const MAX_EXTRACTED_FRAMES = 500;
export const MAX_ESTIMATED_OUTPUT_BYTES = 512 * 1024 * 1024; // Soft estimate guardrail, not an exact memory measurement.
export const VIDEO_METADATA_TIMEOUT_MS = 20_000;
export const DEFAULT_FILENAME_TEMPLATE = "{name}_frame_{index}_{timestamp}";

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

export function formatDurationSimple(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getAspectRatio(width: number, height: number): string {
  if (!width || !height) return "Unknown";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16 (Vertical)";
  if (Math.abs(ratio - 4 / 3) < 0.05) return "4:3";
  if (Math.abs(ratio - 1) < 0.05) return "1:1 (Square)";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9 (Ultrawide)";
  return `${w}:${h}`;
}

/** Calculate output dimensions for a resolution scale without ever upscaling. */
export function calculateScaledDimensions(
  width: number,
  height: number,
  scale: ResolutionScale = "original"
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  if (scale === "original") {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const maxHeight = scale === "1080p" ? 1080 : 720;
  if (height <= maxHeight) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const ratio = maxHeight / height;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: maxHeight,
  };
}

/** Check if a timestamp is already captured within a small tolerance. */
export function hasDuplicateTimestamp(
  frames: Pick<ExtractedFrame, "timestamp">[],
  timestamp: number,
  epsilon = 0.01
): boolean {
  return frames.some((frame) => Math.abs(frame.timestamp - timestamp) <= epsilon);
}

/** Sanitize a filename string by stripping illegal path/OS characters. */
export function sanitizeFilename(raw: string): string {
  return raw
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();
}

/** Format a frame filename from a user template, sanitizing illegal characters. */
export function formatFrameFilename(
  template: string | undefined,
  params: {
    baseName: string;
    index: number;
    formattedTime: string;
    width: number;
    height: number;
    extension: string;
  }
): string {
  const safeBase = sanitizeFilename(params.baseName.replace(/\.[^/.]+$/, "")) || "frames";
  const paddedIndex = String(params.index).padStart(4, "0");
  const safeTime = params.formattedTime.replace(/:/g, "m").replace(/\./g, "s");
  const dimensions = `${params.width}x${params.height}`;
  const rawTemplate = template && template.trim() ? template : DEFAULT_FILENAME_TEMPLATE;

  const rendered = rawTemplate
    .replace(/\{name\}/g, safeBase)
    .replace(/\{index\}/g, paddedIndex)
    .replace(/\{timestamp\}/g, safeTime)
    .replace(/\{width\}x\{height\}/g, dimensions);

  const sanitized = sanitizeFilename(rendered) || `frame_${paddedIndex}`;
  return `${sanitized}.${params.extension}`;
}

/** One shared timestamp algorithm powers both the estimate and real extraction. */
export function buildFrameTimestamps(duration: number, settings: ExtractionSettings): number[] {
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const start = Math.max(0, Math.min(duration, settings.trimStart ?? 0));
  const rawEnd =
    settings.trimEnd !== undefined && Number.isFinite(settings.trimEnd)
      ? Math.min(duration, settings.trimEnd)
      : duration;

  if (rawEnd <= start) return [];

  const rangeDuration = rawEnd - start;

  if (settings.mode === "custom_count") {
    const count = Math.max(1, Math.min(MAX_EXTRACTED_FRAMES, Math.floor(settings.maxFrames || 1)));
    if (count === 1) return [Number(start.toFixed(4))];
    const finalTime = Math.max(start, rawEnd - Math.min(0.05, rangeDuration / 100));
    return Array.from({ length: count }, (_, index) =>
      Number((start + (index / (count - 1)) * (finalTime - start)).toFixed(4))
    );
  }

  const interval =
    settings.mode === "fps"
      ? 1 / Math.max(0.1, Math.min(10, settings.fps || 1))
      : Math.max(0.1, Math.min(5, settings.interval || 1));
  const timestamps: number[] = [];

  // Always capture the opening frame of the range, and avoid asking a decoder to seek exactly to EOF.
  for (let time = start; time < rawEnd; time += interval) {
    const roundedTime = Number(time.toFixed(4));
    if (roundedTime >= rawEnd) break;
    timestamps.push(roundedTime);
  }

  const last = timestamps[timestamps.length - 1] ?? -1;
  const finalTime = Math.max(start, rawEnd - Math.min(0.05, rangeDuration / 100));
  if (last >= 0 && finalTime - last > Math.max(interval * 0.5, 0.05) + 0.001) {
    timestamps.push(Number(finalTime.toFixed(4)));
  }

  return timestamps;
}

export function estimateOutputBytes(
  frameCount: number,
  width: number,
  height: number,
  settings: ExtractionSettings
): number {
  // A deliberately rough estimate. Real output size depends strongly on image content and quality.
  const bytesPerPixel =
    settings.format === "image/png" ? 1.2 : settings.format === "image/webp" ? 0.22 : 0.3;
  return Math.max(0, frameCount * width * height * bytesPerPixel);
}

export async function loadVideoMetadata(file: File): Promise<VideoMetadata> {
  const validExtensions = ["mp4", "webm", "mov", "mkv", "avi"];
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const validMimeTypes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-matroska",
    "video/avi",
    "video/x-msvideo",
    "application/octet-stream",
  ];
  if (!validMimeTypes.includes(file.type) && !validExtensions.includes(extension)) {
    throw new Error(
      "Unsupported file type. Choose an MP4, WebM, MOV, MKV, or AVI file; playback still depends on your browser's codec support."
    );
  }

  const videoUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = videoUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(
        () =>
          finish(
            new Error(
              "Video metadata loading timed out. Try a smaller or browser-compatible video."
            )
          ),
        VIDEO_METADATA_TIMEOUT_MS
      );
      const cleanup = () => {
        window.clearTimeout(timeoutId);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", onError);
        video.removeEventListener("abort", onAbort);
      };
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve();
      };
      const onLoadedMetadata = () => finish();
      const onError = () =>
        finish(
          new Error(
            "The browser could not read this video. Its codec may not be supported, even if the file extension is accepted."
          )
        );
      const onAbort = () =>
        finish(new Error("Video metadata loading was interrupted. Please try again."));
      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("error", onError);
      video.addEventListener("abort", onAbort);
      video.load();
    });

    const duration = video.duration;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error(
        "This video has no finite, readable duration. Live streams and some damaged files are not supported."
      );
    }
    if (!width || !height) {
      throw new Error(
        "The browser could not determine the video's dimensions. The file may use an unsupported codec."
      );
    }
    if (duration > MAX_ALLOWED_DURATION_SECONDS) {
      throw new Error(
        `Video duration (${Math.round(duration)}s) exceeds the ${MAX_ALLOWED_DURATION_SECONDS}-second limit. Please upload a shorter clip.`
      );
    }

    return {
      file,
      name: file.name,
      duration,
      formattedDuration: formatDurationSimple(duration),
      width,
      height,
      aspectRatio: getAspectRatio(width, height),
      size: file.size,
      type: file.type || `video/${extension}`,
      url: videoUrl,
    };
  } catch (error) {
    URL.revokeObjectURL(videoUrl);
    throw error;
  } finally {
    video.removeAttribute("src");
    video.load();
  }
}
