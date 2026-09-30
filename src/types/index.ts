export interface ExtractedFrame {
  id: string;
  index: number;
  timestamp: number; // in seconds
  formattedTime: string;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  selected: boolean;
  sizeBytes: number;
}

export interface VideoMetadata {
  file: File;
  name: string;
  duration: number; // in seconds
  formattedDuration: string;
  width: number;
  height: number;
  aspectRatio: string;
  size: number;
  type: string;
  url: string;
}

export interface ExtractionSettings {
  mode: 'fps' | 'interval' | 'custom_count';
  fps: number; // frames per second (e.g., 1, 2, 5, 10)
  interval: number; // seconds between frames (e.g., 0.2, 0.5, 1.0, 2.0)
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number; // 0.1 to 1.0
  maxFrames?: number;
}

export type ExtractionStatus = 'idle' | 'loading_engine' | 'extracting' | 'completed' | 'error';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
}
