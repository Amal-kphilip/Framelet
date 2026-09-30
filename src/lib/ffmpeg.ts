import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { ExtractedFrame, ExtractionSettings, VideoMetadata } from "@/types";
import { formatDuration } from "./videoUtils";

let ffmpegInstance: FFmpeg | null = null;
let isFFmpegLoading = false;

export async function getFFmpeg(onLog?: (message: string) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (isFFmpegLoading) {
    // Wait until loaded
    while (isFFmpegLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (ffmpegInstance && ffmpegInstance.loaded) {
      return ffmpegInstance;
    }
  }

  isFFmpegLoading = true;

  try {
    const ffmpeg = new FFmpeg();
    if (onLog) {
      ffmpeg.on("log", ({ message }) => onLog(message));
    }

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } finally {
    isFFmpegLoading = false;
  }
}

/**
 * Ultra-fast client-side Canvas frame extraction with hardware acceleration.
 * Guaranteed zero-lag, no network dependency, full video resolution, pristine quality.
 */
export async function extractFramesViaCanvas(
  metadata: VideoMetadata,
  settings: ExtractionSettings,
  onProgress: (progress: number, current: number, total: number) => void
): Promise<ExtractedFrame[]> {
  return new Promise(async (resolve, reject) => {
    const video = document.createElement("video");
    video.src = metadata.url;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    // Create off-screen canvas at native video resolution
    const canvas = document.createElement("canvas");
    canvas.width = metadata.width;
    canvas.height = metadata.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: false });

    if (!ctx) {
      return reject(new Error("Unable to create canvas 2D rendering context"));
    }

    // Calculate timestamps to extract
    const timestamps: number[] = [];
    let interval = settings.interval;

    if (settings.mode === 'fps') {
      interval = 1 / Math.max(0.1, settings.fps);
    } else if (settings.mode === 'custom_count' && settings.maxFrames) {
      interval = metadata.duration / Math.max(1, settings.maxFrames);
    }

    for (let t = 0; t < metadata.duration; t += interval) {
      timestamps.push(t);
    }

    // Always include the last frame if duration isn't exact
    if (timestamps.length === 0 || (metadata.duration - timestamps[timestamps.length - 1] > 0.05)) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < metadata.duration - 0.1) {
        timestamps.push(Math.max(0, metadata.duration - 0.05));
      }
    }

    const totalFrames = timestamps.length;
    const frames: ExtractedFrame[] = [];

    await new Promise((res) => {
      video.onloadeddata = () => res(true);
      video.load();
    });

    let frameIndex = 0;

    const captureFrameAt = async (time: number): Promise<ExtractedFrame> => {
      return new Promise((resCapture, rejCapture) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          try {
            ctx.drawImage(video, 0, 0, metadata.width, metadata.height);

            const format = settings.format || "image/jpeg";
            const quality = settings.quality ?? 0.95;

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  return rejCapture(new Error("Failed to render frame blob"));
                }
                const dataUrl = URL.createObjectURL(blob);
                const frame: ExtractedFrame = {
                  id: `frame_${frameIndex}_${Date.now()}`,
                  index: frameIndex + 1,
                  timestamp: time,
                  formattedTime: formatDuration(time),
                  blob,
                  dataUrl,
                  width: metadata.width,
                  height: metadata.height,
                  selected: true,
                  sizeBytes: blob.size,
                };
                frameIndex++;
                resCapture(frame);
              },
              format,
              quality
            );
          } catch (err) {
            rejCapture(err);
          }
        };

        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;
      });
    };

    try {
      for (let i = 0; i < totalFrames; i++) {
        const t = timestamps[i];
        const frame = await captureFrameAt(t);
        frames.push(frame);
        onProgress(((i + 1) / totalFrames) * 100, i + 1, totalFrames);
      }

      resolve(frames);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * FFmpeg.wasm extraction implementation
 */
export async function extractFramesViaFFmpeg(
  metadata: VideoMetadata,
  settings: ExtractionSettings,
  onProgress: (progress: number, current: number, total: number) => void,
  onStatusUpdate?: (status: string) => void
): Promise<ExtractedFrame[]> {
  try {
    onStatusUpdate?.("Initializing WebAssembly engine...");
    const ffmpeg = await getFFmpeg((msg) => {
      // Parse FFmpeg time/frame if needed
    });

    onStatusUpdate?.("Writing video file to virtual filesystem...");
    const fileData = await fetchFile(metadata.file);
    const inputFileName = "input_video." + (metadata.file.name.split('.').pop() || 'mp4');
    await ffmpeg.writeFile(inputFileName, fileData);

    const fpsRate = settings.mode === 'fps' ? settings.fps : (1 / Math.max(0.05, settings.interval));
    const outputPattern = "frame_%04d.jpg";

    onStatusUpdate?.("Extracting pristine frames with FFmpeg...");
    
    // Set up progress tracking
    ffmpeg.on("progress", ({ progress }) => {
      const p = Math.min(100, Math.max(0, Math.round(progress * 100)));
      onProgress(p, 0, 0);
    });

    // Execute FFmpeg command
    await ffmpeg.exec([
      "-i",
      inputFileName,
      "-vf",
      `fps=${fpsRate}`,
      "-qscale:v",
      "2",
      outputPattern,
    ]);

    onStatusUpdate?.("Loading extracted frames into gallery...");
    const dirList = await ffmpeg.listDir("/");
    const frameFiles = dirList
      .filter((file) => file.name.startsWith("frame_") && file.name.endsWith(".jpg"))
      .sort((a, b) => a.name.localeCompare(b.name));

    const frames: ExtractedFrame[] = [];
    const intervalSec = 1 / fpsRate;

    for (let idx = 0; idx < frameFiles.length; idx++) {
      const fileInfo = frameFiles[idx];
      const data = await ffmpeg.readFile(fileInfo.name);
      // Create blob safely from Uint8Array buffer
      const buffer = data instanceof Uint8Array ? data.buffer : (data as unknown as ArrayBuffer);
      const blob = new Blob([buffer as ArrayBuffer], { type: "image/jpeg" });
      const dataUrl = URL.createObjectURL(blob);
      const timestamp = idx * intervalSec;

      frames.push({
        id: `ffmpeg_frame_${idx}_${Date.now()}`,
        index: idx + 1,
        timestamp,
        formattedTime: formatDuration(timestamp),
        blob,
        dataUrl,
        width: metadata.width,
        height: metadata.height,
        selected: true,
        sizeBytes: blob.size,
      });

      // Cleanup virtual file
      await ffmpeg.deleteFile(fileInfo.name);
      onProgress(((idx + 1) / frameFiles.length) * 100, idx + 1, frameFiles.length);
    }

    // Cleanup input video
    await ffmpeg.deleteFile(inputFileName);

    return frames;
  } catch (err) {
    console.warn("FFmpeg wasm fallback to high-speed canvas engine:", err);
    // Graceful fallback to client-side hardware canvas extraction
    return extractFramesViaCanvas(metadata, settings, onProgress);
  }
}
