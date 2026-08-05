import { COLOR_FILTERS, clipLength, type Clip, type TextOverlay } from "./types";

interface ExportOptions {
  clips: Clip[];
  overlays: TextOverlay[];
  musicUrl?: string | null;
  musicVolume: number;
  originalVolume: number;
  voiceoverUrl?: string | null;
  voiceoverVolume?: number;
  width?: number;
  height?: number;
  onProgress?: (ratio: number) => void;
}

function pickMime() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "video/webm";
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: HTMLVideoElement | HTMLImageElement,
  w: number,
  h: number,
) {
  const sw = "videoWidth" in src ? src.videoWidth : src.naturalWidth;
  const sh = "videoHeight" in src ? src.videoHeight : src.naturalHeight;
  if (!sw || !sh) return;
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function drawOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: TextOverlay[],
  t: number,
  w: number,
  h: number,
) {
  ctx.filter = "none";
  for (const o of overlays) {
    if (t < o.start || t > o.end || !o.text.trim()) continue;
    const size = (o.size * w) / 1080;
    ctx.font = `900 ${size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = size * 0.35;
    ctx.fillStyle = o.color;
    ctx.fillText(o.text, o.x * w, o.y * h);
    ctx.shadowBlur = 0;
  }
}

/**
 * Renders the timeline in real time onto a canvas and records it, mixing
 * clip audio, music, and voiceover into the output track.
 */
export async function exportProject(opts: ExportOptions): Promise<Blob> {
  const {
    clips,
    overlays,
    musicUrl,
    musicVolume,
    originalVolume,
    voiceoverUrl,
    voiceoverVolume = 1,
    width = 720,
    height = 1280,
    onProgress,
  } = opts;

  if (clips.length === 0) throw new Error("Add at least one clip before exporting");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  const AudioCtor: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtor();
  const dest = audioCtx.createMediaStreamDestination();

  const attach = (el: HTMLMediaElement, volume: number) => {
    try {
      const src = audioCtx.createMediaElementSource(el);
      const gain = audioCtx.createGain();
      gain.gain.value = volume;
      src.connect(gain).connect(dest);
    } catch {
      /* element without decodable audio */
    }
  };

  let music: HTMLAudioElement | null = null;
  if (musicUrl) {
    music = new Audio(musicUrl);
    music.crossOrigin = "anonymous";
    music.loop = true;
    attach(music, musicVolume);
  }
  let voice: HTMLAudioElement | null = null;
  if (voiceoverUrl) {
    voice = new Audio(voiceoverUrl);
    voice.crossOrigin = "anonymous";
    attach(voice, voiceoverVolume);
  }

  const stream = canvas.captureStream(30);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType: pickMime() });
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
  });

  const total = clips.reduce((s, c) => s + clipLength(c), 0);
  let elapsed = 0;

  recorder.start();
  await audioCtx.resume().catch(() => {});
  music?.play().catch(() => {});
  voice?.play().catch(() => {});

  for (const clip of clips) {
    const filter = COLOR_FILTERS[clip.filter].css;
    if (clip.kind === "image") {
      const img = new Image();
      img.src = clip.url;
      await img.decode().catch(() => {});
      const shown = clipLength(clip);
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const local = (performance.now() - start) / 1000;
          if (local >= shown) return resolve();
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, width, height);
          ctx.filter = filter;
          drawCover(ctx, img, width, height);
          drawOverlays(ctx, overlays, elapsed + local, width, height);
          onProgress?.(Math.min(1, (elapsed + local) / total));
          requestAnimationFrame(tick);
        };
        tick();
      });
      elapsed += shown;
    } else {
      const video = document.createElement("video");
      video.src = clip.url;
      video.playsInline = true;
      video.muted = clip.volume === 0;
      video.volume = 1;
      attach(video, clip.volume * originalVolume);
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => resolve();
      });
      video.currentTime = clip.trimStart;
      video.playbackRate = clip.speed;
      await video.play().catch(() => {});
      const shown = clipLength(clip);
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const local = (performance.now() - start) / 1000;
          if (local >= shown || video.ended || video.currentTime >= clip.trimEnd) {
            video.pause();
            return resolve();
          }
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, width, height);
          ctx.filter = filter;
          drawCover(ctx, video, width, height);
          drawOverlays(ctx, overlays, elapsed + local, width, height);
          onProgress?.(Math.min(1, (elapsed + local) / total));
          requestAnimationFrame(tick);
        };
        tick();
      });
      elapsed += shown;
    }
  }

  music?.pause();
  voice?.pause();
  recorder.stop();
  const blob = await done;
  await audioCtx.close().catch(() => {});
  onProgress?.(1);
  return blob;
}

/** Renders a single JPEG thumbnail from the first frame of the timeline. */
export async function renderThumbnail(clip: Clip, width = 540, height = 960): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = COLOR_FILTERS[clip.filter].css;

  if (clip.kind === "image") {
    const img = new Image();
    img.src = clip.url;
    await img.decode().catch(() => {});
    drawCover(ctx, img, width, height);
  } else {
    const video = document.createElement("video");
    video.src = clip.url;
    video.muted = true;
    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => resolve();
    });
    video.currentTime = Math.min(clip.trimStart + 0.1, Math.max(0, clip.duration - 0.1));
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      setTimeout(resolve, 800);
    });
    drawCover(ctx, video, width, height);
  }
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
}
