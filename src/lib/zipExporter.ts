import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { ExtractedFrame } from "@/types";

export const MAX_ZIP_EXPORT_BYTES = 512 * 1024 * 1024;

export interface ZipExportProgress {
  percent: number;
  current: number;
  total: number;
  status: string;
}

function safeBaseName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim() || "frames";
}

export function getImageExtension(blob: Blob): string {
  switch (blob.type.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg": return "jpg";
    case "image/png": return "png";
    case "image/webp": return "webp";
    default: return "img";
  }
}

function getFrameFilename(baseName: string, frame: ExtractedFrame): string {
  const index = String(frame.index).padStart(4, "0");
  const safeTime = frame.formattedTime.replace(/:/g, "m").replace(/\./g, "s");
  return `${baseName}_frame_${index}_${safeTime}.${getImageExtension(frame.blob)}`;
}

export async function exportFramesToZip(
  frames: ExtractedFrame[],
  videoName: string,
  onProgress?: (progress: ZipExportProgress) => void,
  totalExtractedFrames = frames.length
): Promise<void> {
  if (frames.length === 0) throw new Error("No frames selected for export.");

  const selectedImageBytes = frames.reduce((totalBytes, frame) => totalBytes + frame.blob.size, 0);
  if (selectedImageBytes > MAX_ZIP_EXPORT_BYTES) {
    throw new Error(`The selected images total ${Math.round(selectedImageBytes / (1024 * 1024))} MiB, above the 512 MiB ZIP-export safety limit. Deselect some frames and export in smaller batches.`);
  }

  const zip = new JSZip();
  const baseName = safeBaseName(videoName);
  const total = frames.length;
  const sortedFrames = [...frames].sort((a, b) => a.index - b.index);

  onProgress?.({ percent: 2, current: 0, total, status: "Preparing selected images…" });
  for (let index = 0; index < sortedFrames.length; index += 1) {
    const frame = sortedFrames[index];
    zip.file(getFrameFilename(baseName, frame), frame.blob, { compression: "STORE" });
    if ((index + 1) % 5 === 0 || index === total - 1) {
      const percent = 5 + Math.round(((index + 1) / total) * 65);
      onProgress?.({ percent, current: index + 1, total, status: `Adding image ${index + 1} of ${total}…` });
      // Yield periodically so the UI can render progress for large exports.
      if ((index + 1) % 20 === 0) await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
  }

  zip.file("metadata.json", JSON.stringify({
    app: "Framelet",
    schemaVersion: 1,
    originalVideo: videoName,
    exportedAt: new Date().toISOString(),
    totalFramesExtracted: totalExtractedFrames,
    totalFramesExported: frames.length,
    selectedFramesCount: frames.length,
    resolution: `${frames[0]?.width || 0}x${frames[0]?.height || 0}`,
    frames: sortedFrames.map((frame) => ({
      index: frame.index,
      timestampSeconds: frame.timestamp,
      formattedTime: frame.formattedTime,
      width: frame.width,
      height: frame.height,
      mimeType: frame.blob.type || "application/octet-stream",
      fileName: getFrameFilename(baseName, frame),
      sizeBytes: frame.sizeBytes,
    })),
  }, null, 2), { compression: "DEFLATE", compressionOptions: { level: 6 } });

  onProgress?.({ percent: 72, current: total, total, status: "Creating ZIP archive…" });
  const zipBlob = await zip.generateAsync(
    { type: "blob", compression: "STORE" },
    (metadata) => onProgress?.({
      percent: Math.min(99, 72 + Math.round(metadata.percent * 0.27)),
      current: total,
      total,
      status: `Creating archive (${Math.round(metadata.percent)}%)…`,
    })
  );

  const fileName = `${baseName}_frames_${Date.now()}.zip`;
  saveAs(zipBlob, fileName);
  onProgress?.({ percent: 100, current: total, total, status: "Download started." });
}

export function downloadSingleFrame(frame: ExtractedFrame, videoName: string): void {
  const baseName = safeBaseName(videoName);
  saveAs(frame.blob, getFrameFilename(baseName, frame));
}
