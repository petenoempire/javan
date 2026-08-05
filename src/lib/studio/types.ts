export type ColorFilterKey =
  | "none"
  | "warm"
  | "cool"
  | "mono"
  | "vivid"
  | "vintage"
  | "noir"
  | "cinema"
  | "dream";

export const COLOR_FILTERS: Record<ColorFilterKey, { label: string; css: string }> = {
  none: { label: "Normal", css: "none" },
  warm: { label: "Warm", css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  cool: { label: "Cool", css: "hue-rotate(15deg) saturate(1.2) brightness(1.05)" },
  mono: { label: "Mono", css: "grayscale(1) contrast(1.1)" },
  vivid: { label: "Vivid", css: "saturate(1.8) contrast(1.15)" },
  vintage: { label: "Vintage", css: "sepia(0.5) contrast(0.9) brightness(0.95) saturate(0.8)" },
  noir: { label: "Noir", css: "grayscale(1) contrast(1.4) brightness(0.9)" },
  cinema: { label: "Cinema", css: "contrast(1.2) saturate(0.9) brightness(0.95) hue-rotate(-8deg)" },
  dream: { label: "Dream", css: "saturate(1.3) brightness(1.1) blur(0.4px)" },
};

export type StudioMode = "photo" | "15s" | "60s" | "3min" | "text" | "template" | "live";

export const MODE_LIMITS: Record<StudioMode, number> = {
  photo: 0,
  "15s": 15,
  "60s": 60,
  "3min": 180,
  text: 0,
  template: 60,
  live: 0,
};

export interface Clip {
  id: string;
  kind: "video" | "image";
  url: string;
  blob: Blob;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  filter: ColorFilterKey;
  volume: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  start: number;
  end: number;
  x: number; // 0..1
  y: number; // 0..1
  size: number; // px at 1080 width
  color: string;
}

export interface MusicSelection {
  id: string;
  title: string;
  artist?: string;
  url: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function clipLength(c: Clip) {
  return Math.max(0.1, (c.trimEnd - c.trimStart) / (c.speed || 1));
}

export function projectDuration(clips: Clip[]) {
  return clips.reduce((s, c) => s + clipLength(c), 0);
}

export function readMediaDuration(file: Blob, kind: "video" | "image"): Promise<number> {
  if (kind === "image") return Promise.resolve(3);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 5;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(5);
    };
    v.src = url;
  });
}

export async function makeClip(blob: Blob, kind: "video" | "image"): Promise<Clip> {
  const duration = await readMediaDuration(blob, kind);
  return {
    id: uid(),
    kind,
    blob,
    url: URL.createObjectURL(blob),
    duration,
    trimStart: 0,
    trimEnd: duration,
    speed: 1,
    filter: "none",
    volume: 1,
  };
}
