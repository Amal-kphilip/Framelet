import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { ExtractedFrame, ExtractionSettings, VideoMetadata } from "@/types";
import { buildFrameTimestamps, estimateOutputBytes, formatBytes, formatDuration, MAX_ESTIMATED_OUTPUT_BYTES, MAX_EXTRACTED_FRAMES } from "./videoUtils";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error("Frame extraction was cancelled.");
    error.name = "AbortError";
    throw error;
  }
}

/** Optional FFmpeg.wasm engine. The main UI currently uses the smaller browser-native Canvas engine. */
export async function getFFmpeg(onLog?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) return ffmpegInstance;
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })().finally(() => {
      ffmpegLoadPromise = null;
    });
  }
  return ffmpegLoadPromise;
}

export async function extractFramesViaFFmpeg(
  metadata: VideoMetadata,
  settings: ExtractionSettings,
  onProgress: (progress: number, current: number, total: number) => void,
  onStatusUpdate?: (status: string) => void,
  signal?: AbortSignal
): Promise<ExtractedFrame[]> {
  // Keep fallback behavior explicit; callers can use Canvas if the WASM engine is unavailable.
  throwIfAborted(signal);
  if (settings.mode === "custom_count") {
    throw new Error("The optional FFmpeg helper does not support exact custom-count extraction. Use the Canvas engine for custom frame counts.");
  }
  const timestamps = buildFrameTimestamps(metadata.duration, settings);
  if (!timestamps.length || timestamps.length > MAX_EXTRACTED_FRAMES) {
    throw new Error(`Choose a configuration that extracts between 1 and ${MAX_EXTRACTED_FRAMES} frames.`);
  }
  const estimatedBytes = estimateOutputBytes(timestamps.length, metadata.width, metadata.height, settings);
  if (estimatedBytes > MAX_ESTIMATED_OUTPUT_BYTES) throw new Error(`Estimated output (${formatBytes(estimatedBytes)}) exceeds the 512 MiB safety guardrail.`);

  const ffmpeg = await getFFmpeg();
  throwIfAborted(signal);
  const extension = metadata.file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "") || "mp4";
  const inputFileName = `input_video.${extension}`;
  const outputExtension = settings.format === "image/png" ? "png" : settings.format === "image/webp" ? "webp" : "jpg";
  const outputPattern = `frame_%04d.${outputExtension}`;
  const outputFiles: string[] = [];
  const frames: ExtractedFrame[] = [];
  const onFfmpegProgress = ({ progress }: { progress: number }) => {
    onProgress(Math.min(99, Math.max(0, Math.round(progress * 100))), 0, timestamps.length);
  };
  const onAbort = () => {
    // FFmpeg.wasm cannot interrupt a running exec cleanly; terminating its worker does.
    if (ffmpegInstance === ffmpeg) ffmpegInstance = null;
    ffmpeg.terminate();
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    onStatusUpdate?.("Preparing local video for FFmpeg...");
    await ffmpeg.writeFile(inputFileName, await fetchFile(metadata.file));
    ffmpeg.on("progress", onFfmpegProgress);

    const interval = settings.mode === "fps" ? 1 / Math.max(0.1, settings.fps) : settings.interval;
    const filters = `fps=${1 / Math.max(0.1, interval)}`;
    const args = ["-i", inputFileName, "-vf", filters];
    if (outputExtension === "jpg") args.push("-q:v", String(Math.max(2, Math.round((1 - settings.quality) * 31))));
    if (outputExtension === "webp") args.push("-quality", String(Math.round(settings.quality * 100)));
    args.push(outputPattern);

    onStatusUpdate?.("Extracting frames in WebAssembly...");
    await ffmpeg.exec(args);
    throwIfAborted(signal);

    const listing = await ffmpeg.listDir("/");
    const outputPatternRegex = new RegExp(`^frame_\\d+\\.${outputExtension}$`);
    const output = listing.filter((entry) => outputPatternRegex.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name));
    outputFiles.push(...output.map((entry) => entry.name));
    if (!output.length) throw new Error("FFmpeg completed without producing any frame images.");

    for (let index = 0; index < output.length; index += 1) {
      throwIfAborted(signal);
      const data = await ffmpeg.readFile(output[index].name);
      const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new Uint8Array(data as unknown as ArrayBuffer);
      const blob = new Blob([bytes], { type: settings.format });
      const timestamp = Math.min(metadata.duration, index * interval);
      frames.push({
        id: `ffmpeg_frame_${index}_${timestamp.toFixed(3)}`,
        index: index + 1,
        timestamp,
        formattedTime: formatDuration(timestamp),
        blob,
        dataUrl: URL.createObjectURL(blob),
        width: metadata.width,
        height: metadata.height,
        selected: true,
        sizeBytes: blob.size,
      });
      onProgress(Math.round(((index + 1) / output.length) * 100), index + 1, output.length);
      await ffmpeg.deleteFile(output[index].name);
    }
    return frames;
  } catch (error) {
    frames.forEach((frame) => URL.revokeObjectURL(frame.dataUrl));
    throw error;
  } finally {
    signal?.removeEventListener("abort", onAbort);
    ffmpeg.off("progress", onFfmpegProgress);
    await Promise.allSettled([ffmpeg.deleteFile(inputFileName), ...outputFiles.map((file) => ffmpeg.deleteFile(file))]);
  }
}
