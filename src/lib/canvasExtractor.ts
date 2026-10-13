import type { ExtractedFrame, ExtractionSettings, VideoMetadata } from "@/types";
import { buildFrameTimestamps, estimateOutputBytes, formatDuration, MAX_ESTIMATED_OUTPUT_BYTES, MAX_EXTRACTED_FRAMES, formatBytes } from "./videoUtils";

const SEEK_TIMEOUT_MS = 10_000;
const VIDEO_READY_TIMEOUT_MS = 20_000;
const MAX_CANVAS_PIXELS = 100_000_000;

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error("Frame extraction was cancelled.");
    error.name = "AbortError";
    throw error;
  }
}

function abortError(): Error {
  const error = new Error("Frame extraction was cancelled.");
  error.name = "AbortError";
  return error;
}

function waitForMediaEvent(
  video: HTMLVideoElement,
  eventName: "loadeddata" | "seeked",
  timeoutMs: number,
  signal?: AbortSignal,
  startAction?: () => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener(eventName, onReady);
      video.removeEventListener("error", onError);
      video.removeEventListener("abort", onAbort);
      signal?.removeEventListener("abort", onSignalAbort);
    };
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };
    const onReady = () => finish();
    const onError = () => finish(new Error("The browser failed to decode this video frame. The codec may not be supported."));
    const onAbort = () => finish(new Error("The video decoder interrupted frame extraction."));
    const onSignalAbort = () => finish(abortError());
    const timeoutId = window.setTimeout(() => finish(new Error("The browser took too long to decode or seek to a frame. Try a shorter video or a different format.")), timeoutMs);

    video.addEventListener(eventName, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.addEventListener("abort", onAbort, { once: true });
    signal?.addEventListener("abort", onSignalAbort, { once: true });
    if (signal?.aborted) {
      onSignalAbort();
    } else {
      try {
        startAction?.();
      } catch (error) {
        finish(new Error(error instanceof Error ? error.message : "The browser could not start seeking to the requested frame."));
      }
    }
  });
}

async function seekToTime(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  const safeTime = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.001)));
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && Math.abs(video.currentTime - safeTime) < 0.001) {
    return;
  }
  await waitForMediaEvent(video, "seeked", SEEK_TIMEOUT_MS, signal, () => {
    video.currentTime = safeTime;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The browser could not encode this frame. Try another image format or a lower resolution."));
      } else if (blob.type !== type) {
        reject(new Error(`Your browser does not support ${type.replace("image/", "").toUpperCase()} encoding for canvas images. Choose JPEG, PNG, or WebP supported by your browser.`));
      } else {
        resolve(blob);
      }
    }, type, quality);
  });
}

/** Browser-native Canvas extractor. It works with codecs the current browser can decode. */
export async function extractFramesViaCanvas(
  metadata: VideoMetadata,
  settings: ExtractionSettings,
  onProgress: (progress: number, current: number, total: number) => void,
  signal?: AbortSignal
): Promise<ExtractedFrame[]> {
  throwIfAborted(signal);
  const timestamps = buildFrameTimestamps(metadata.duration, settings);
  if (timestamps.length === 0) throw new Error("No valid frame timestamps could be generated for this video.");
  if (timestamps.length > MAX_EXTRACTED_FRAMES) {
    throw new Error(`This configuration would create ${timestamps.length} frames. The current safety limit is ${MAX_EXTRACTED_FRAMES} frames per extraction. Increase the interval or lower the frame rate.`);
  }
  if (metadata.width * metadata.height > MAX_CANVAS_PIXELS) {
    throw new Error("This video's resolution is too large for safe browser Canvas processing. Try a lower-resolution clip.");
  }
  const estimatedOutputBytes = estimateOutputBytes(timestamps.length, metadata.width, metadata.height, settings);
  if (estimatedOutputBytes > MAX_ESTIMATED_OUTPUT_BYTES) {
    throw new Error(`The rough output estimate is ${formatBytes(estimatedOutputBytes)}, above the 512 MiB safety guardrail. Use fewer frames or a smaller source video.`);
  }

  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const frames: ExtractedFrame[] = [];
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = metadata.url;
  canvas.width = metadata.width;
  canvas.height = metadata.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    video.removeAttribute("src");
    video.load();
    canvas.width = 0;
    canvas.height = 0;
    throw new Error("Unable to create a Canvas 2D rendering context in this browser.");
  }

  try {
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      const wait = waitForMediaEvent(video, "loadeddata", VIDEO_READY_TIMEOUT_MS, signal);
      video.load();
      await wait;
    }
    throwIfAborted(signal);

    for (let index = 0; index < timestamps.length; index += 1) {
      throwIfAborted(signal);
      const timestamp = timestamps[index];
      await seekToTime(video, timestamp, signal);
      throwIfAborted(signal);
      context.drawImage(video, 0, 0, metadata.width, metadata.height);
      const blob = await canvasToBlob(canvas, settings.format || "image/jpeg", settings.quality ?? 0.92);
      throwIfAborted(signal);
      const dataUrl = URL.createObjectURL(blob);
      frames.push({
        id: `frame_${index}_${timestamp.toFixed(3).replace(".", "_")}`,
        index: index + 1,
        timestamp,
        formattedTime: formatDuration(timestamp),
        blob,
        dataUrl,
        width: metadata.width,
        height: metadata.height,
        selected: true,
        sizeBytes: blob.size,
      });
      onProgress(Math.round(((index + 1) / timestamps.length) * 100), index + 1, timestamps.length);
    }
    return frames;
  } catch (error) {
    frames.forEach((frame) => URL.revokeObjectURL(frame.dataUrl));
    throw error;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    canvas.width = 0;
    canvas.height = 0;
  }
}
