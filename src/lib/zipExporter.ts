import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ExtractedFrame } from "@/types";

export interface ZipExportProgress {
  percent: number;
  current: number;
  total: number;
  status: string;
}

export async function exportFramesToZip(
  frames: ExtractedFrame[],
  videoName: string,
  onProgress?: (progress: ZipExportProgress) => void
): Promise<void> {
  if (frames.length === 0) {
    throw new Error("No frames selected for export");
  }

  const zip = new JSZip();
  const baseName = videoName.replace(/\.[^/.]+$/, "");
  const folder = zip.folder(`${baseName}_frames`) || zip;

  const total = frames.length;

  onProgress?.({
    percent: 10,
    current: 0,
    total,
    status: "Preparing high-resolution images...",
  });

  // Add frames to zip folder
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const paddedIndex = String(frame.index).padStart(4, "0");
    const safeTime = frame.formattedTime.replace(":", "m").replace(".", "s");
    const filename = `${baseName}_frame_${paddedIndex}_${safeTime}.jpg`;

    folder.file(filename, frame.blob);

    if (onProgress && i % 5 === 0) {
      const p = 10 + Math.round((i / total) * 60);
      onProgress({
        percent: p,
        current: i + 1,
        total,
        status: `Packaging frame ${i + 1} of ${total}...`,
      });
    }
  }

  // Add manifest metadata JSON
  const metadata = {
    originalVideo: videoName,
    exportedAt: new Date().toISOString(),
    totalFramesExtracted: frames.length,
    resolution: `${frames[0]?.width || 0}x${frames[0]?.height || 0}`,
    frames: frames.map((f) => ({
      index: f.index,
      timestamp: f.timestamp,
      formattedTime: f.formattedTime,
      width: f.width,
      height: f.height,
      sizeBytes: f.sizeBytes,
    })),
  };

  folder.file("metadata.json", JSON.stringify(metadata, null, 2));

  onProgress?.({
    percent: 75,
    current: total,
    total,
    status: "Compressing into ZIP archive...",
  });

  // Generate ZIP file
  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 6,
      },
    },
    (metadata) => {
      if (onProgress) {
        const p = 75 + Math.round((metadata.percent / 100) * 23);
        onProgress({
          percent: Math.min(99, p),
          current: total,
          total,
          status: `Compressing archive (${Math.round(metadata.percent)}%)...`,
        });
      }
    }
  );

  onProgress?.({
    percent: 100,
    current: total,
    total,
    status: "Download initiated!",
  });

  // Trigger download
  const zipFileName = `${baseName}_frames_${Date.now()}.zip`;
  saveAs(zipBlob, zipFileName);
}

export function downloadSingleFrame(frame: ExtractedFrame, videoName: string): void {
  const baseName = videoName.replace(/\.[^/.]+$/, "");
  const paddedIndex = String(frame.index).padStart(4, "0");
  const safeTime = frame.formattedTime.replace(":", "m").replace(".", "s");
  const filename = `${baseName}_frame_${paddedIndex}_${safeTime}.jpg`;
  saveAs(frame.blob, filename);
}
