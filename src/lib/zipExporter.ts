import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { ExtractedFrame } from "@/types";
import { formatFrameFilename, sanitizeFilename } from "./videoUtils";

export const MAX_ZIP_EXPORT_BYTES = 512 * 1024 * 1024;

export interface ZipExportProgress {
  percent: number;
  current: number;
  total: number;
  status: string;
}

function safeBaseName(name: string): string {
  return sanitizeFilename(name.replace(/\.[^/.]+$/, "")) || "frames";
}

export function getImageExtension(blob: Blob): string {
  switch (blob.type.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "img";
  }
}

function getFrameFilename(
  baseName: string,
  frame: ExtractedFrame,
  filenameTemplate?: string
): string {
  return formatFrameFilename(filenameTemplate, {
    baseName,
    index: frame.index,
    formattedTime: frame.formattedTime,
    width: frame.width,
    height: frame.height,
    extension: getImageExtension(frame.blob),
  });
}

function getUniqueFrameFilename(
  baseName: string,
  frame: ExtractedFrame,
  usedNames: Set<string>,
  filenameTemplate?: string
): string {
  const candidate = getFrameFilename(baseName, frame, filenameTemplate);
  if (!usedNames.has(candidate)) {
    usedNames.add(candidate);
    return candidate;
  }
  const dotIndex = candidate.lastIndexOf(".");
  const stem = dotIndex >= 0 ? candidate.slice(0, dotIndex) : candidate;
  const ext = dotIndex >= 0 ? candidate.slice(dotIndex) : "";
  let suffix = 2;
  while (usedNames.has(`${stem}_${suffix}${ext}`)) {
    suffix += 1;
  }
  const unique = `${stem}_${suffix}${ext}`;
  usedNames.add(unique);
  return unique;
}

export async function exportFramesToZip(
  frames: ExtractedFrame[],
  videoName: string,
  onProgress?: (progress: ZipExportProgress) => void,
  totalExtractedFrames = frames.length,
  filenameTemplate?: string
): Promise<void> {
  if (frames.length === 0) throw new Error("No frames selected for export.");

  const selectedImageBytes = frames.reduce((totalBytes, frame) => totalBytes + frame.blob.size, 0);
  if (selectedImageBytes > MAX_ZIP_EXPORT_BYTES) {
    throw new Error(
      `The selected images total ${Math.round(selectedImageBytes / (1024 * 1024))} MiB, above the 512 MiB ZIP-export safety limit. Deselect some frames and export in smaller batches.`
    );
  }

  const zip = new JSZip();
  const baseName = safeBaseName(videoName);
  const total = frames.length;
  const sortedFrames = [...frames].sort((a, b) => a.index - b.index);
  const usedNames = new Set<string>();
  const resolvedNames = new Map<string, string>();

  onProgress?.({ percent: 2, current: 0, total, status: "Preparing selected images…" });
  for (let index = 0; index < sortedFrames.length; index += 1) {
    const frame = sortedFrames[index];
    const fileName = getUniqueFrameFilename(baseName, frame, usedNames, filenameTemplate);
    resolvedNames.set(frame.id, fileName);
    zip.file(fileName, frame.blob, { compression: "STORE" });
    if ((index + 1) % 5 === 0 || index === total - 1) {
      const percent = 5 + Math.round(((index + 1) / total) * 65);
      onProgress?.({
        percent,
        current: index + 1,
        total,
        status: `Adding image ${index + 1} of ${total}…`,
      });
      // Yield periodically so the UI can render progress for large exports.
      if ((index + 1) % 20 === 0)
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    }
  }

  zip.file(
    "metadata.json",
    JSON.stringify(
      {
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
          fileName:
            resolvedNames.get(frame.id) ?? getFrameFilename(baseName, frame, filenameTemplate),
          sizeBytes: frame.sizeBytes,
        })),
      },
      null,
      2
    ),
    { compression: "DEFLATE", compressionOptions: { level: 6 } }
  );

  onProgress?.({ percent: 72, current: total, total, status: "Creating ZIP archive…" });
  const zipBlob = await zip.generateAsync({ type: "blob", compression: "STORE" }, (metadata) =>
    onProgress?.({
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

export function downloadSingleFrame(
  frame: ExtractedFrame,
  videoName: string,
  filenameTemplate?: string
): void {
  const baseName = safeBaseName(videoName);
  saveAs(frame.blob, getFrameFilename(baseName, frame, filenameTemplate));
}
