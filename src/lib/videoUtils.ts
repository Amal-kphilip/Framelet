import { VideoMetadata } from "@/types";

export const MAX_ALLOWED_DURATION_SECONDS = 90;

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export function formatDurationSimple(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function getAspectRatio(width: number, height: number): string {
  if (!width || !height) return "16:9";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  
  // Return standard representations if close
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return "16:9";
  if (Math.abs(ratio - 9 / 16) < 0.05) return "9:16 (Vertical)";
  if (Math.abs(ratio - 4 / 3) < 0.05) return "4:3";
  if (Math.abs(ratio - 1) < 0.05) return "1:1 (Square)";
  if (Math.abs(ratio - 21 / 9) < 0.05) return "21:9 (Ultrawide)";

  return `${w}:${h}`;
}

export function loadVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/avi"];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidExt = ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(fileExtension || '');

    if (!validTypes.includes(file.type) && !isValidExt) {
      return reject(new Error("Unsupported video format. Please upload MP4, WebM, or MOV files."));
    }

    const video = document.createElement("video");
    const videoUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.src = videoUrl;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (duration > MAX_ALLOWED_DURATION_SECONDS) {
        URL.revokeObjectURL(videoUrl);
        return reject(
          new Error(
            `Video duration (${Math.round(duration)}s) exceeds the 90-second limit. Please upload a shorter clip.`
          )
        );
      }

      const metadata: VideoMetadata = {
        file,
        name: file.name,
        duration,
        formattedDuration: formatDurationSimple(duration),
        width,
        height,
        aspectRatio: getAspectRatio(width, height),
        size: file.size,
        type: file.type || `video/${fileExtension}`,
        url: videoUrl,
      };

      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Failed to load video. The file may be corrupt or an unreadable codec."));
    };
  });
}
