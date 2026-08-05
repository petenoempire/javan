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
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
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
  ctx.save();
  ctx.filter = "none";
  for (const o of overlays) {
    if (t < o.start || t > o.end || !o.text.trim()) continue;
    
    // Smart Text Overlay Enhancements: Dynamic scaling and better shadows
    const size = (o.size * w) / 1080;
    ctx.font = `900 ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Multi-layered shadow for "High Definition" look
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = size * 0.15;
    ctx.shadowOffsetX = size * 0.05;
    ctx.shadowOffsetY = size * 0.05;
    
    ctx.fillStyle = o.color;
    ctx.fillText(o.text, o.x * w, o.y * h);
    
    // Reset shadow for next overlay
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  ctx.restore();
}

/**
 * Robust Export & Rendering Pipeline
 * Optimized for mobile browsers with better memory management and audio stems mixing.
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
    width = 1080, // Upgraded to HD by default
    height = 1920,
    onProgress,
  } = opts;

  if (clips.length === 0) throw new Error("Add at least one clip before exporting");

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  // Audio Pipeline: Using MediaStream for mixing stems
  const AudioCtor: typeof AudioContext =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtor();
  const dest = audioCtx.createMediaStreamDestination();

  const activeElements: HTMLMediaElement[] = [];
  const attach = (el: HTMLMediaElement, volume: number) => {
    try {
      const src = audioCtx.createMediaElementSource(el);
      const gain = audioCtx.createGain();
      gain.gain.value = volume;
      src.connect(gain).connect(dest);
      activeElements.push(el);
    } catch (e) {
      console.warn("Audio attachment failed", e);
    }
  };

  // Setup Music Stem
  let music: HTMLAudioElement | null = null;
  if (musicUrl) {
    music = new Audio(musicUrl);
    music.crossOrigin = "anonymous";
    music.loop = true;
    attach(music, musicVolume);
  }

  // Setup Voiceover Stem
  let voice: HTMLAudioElement | null = null;
  if (voiceoverUrl) {
    voice = new Audio(voiceoverUrl);
    voice.crossOrigin = "anonymous";
    attach(voice, voiceoverVolume);
  }

  const fps = 30;
  const stream = canvas.captureStream(fps);
  dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

  const chunks: Blob[] = [];
  const mimeType = pickMime();
  const recorder = new MediaRecorder(stream, { 
    mimeType,
    videoBitsPerSecond: 5000000 // 5Mbps for HD quality
  });
  
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  const total = clips.reduce((s, c) => s + clipLength(c), 0);
  let elapsed = 0;

  recorder.start();
  await audioCtx.resume().catch(() => {});
  
  if (music) {
    music.currentTime = 0;
    await music.play().catch(() => {});
  }
  if (voice) {
    voice.currentTime = 0;
    await voice.play().catch(() => {});
  }

  // Render Loop
  for (const clip of clips) {
    const filter = COLOR_FILTERS[clip.filter].css;
    const duration = clipLength(clip);
    
    if (clip.kind === "image") {
      const img = new Image();
      img.src = clip.url;
      img.crossOrigin = "anonymous";
      await img.decode().catch(() => {});
      
      const frames = Math.ceil(duration * fps);
      for (let i = 0; i < frames; i++) {
        const localT = i / fps;
        const globalT = elapsed + localT;
        
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);
        ctx.filter = filter;
        drawCover(ctx, img, width, height);
        drawOverlays(ctx, overlays, globalT, width, height);
        
        onProgress?.(Math.min(0.99, globalT / total));
        // Wait for next frame to avoid UI throttling
        await new Promise(requestAnimationFrame);
      }
      elapsed += duration;
    } else {
      const video = document.createElement("video");
      video.src = clip.url;
      video.crossOrigin = "anonymous";
      video.playsInline = true;
      video.muted = false;
      video.volume = 1;
      attach(video, clip.volume * originalVolume);
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => resolve();
      });
      
      video.currentTime = clip.trimStart;
      video.playbackRate = clip.speed;
      await video.play().catch(() => {});
      
      const startT = performance.now();
      await new Promise<void>((resolve) => {
        const tick = () => {
          const now = performance.now();
          const localT = (now - startT) / 1000;
          const globalT = elapsed + localT;
          
          if (localT >= duration || video.ended || video.currentTime >= clip.trimEnd) {
            video.pause();
            // Cleanup to prevent memory leaks
            video.src = "";
            video.load();
            return resolve();
          }
          
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, width, height);
          ctx.filter = filter;
          drawCover(ctx, video, width, height);
          drawOverlays(ctx, overlays, globalT, width, height);
          
          onProgress?.(Math.min(0.99, globalT / total));
          requestAnimationFrame(tick);
        };
        tick();
      });
      elapsed += duration;
    }
  }

  // Finalize
  music?.pause();
  voice?.pause();
  recorder.stop();
  const blob = await done;
  
  // Cleanup
  await audioCtx.close().catch(() => {});
  activeElements.forEach(el => {
    el.src = "";
    el.load();
  });
  
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
    img.crossOrigin = "anonymous";
    await img.decode().catch(() => {});
    drawCover(ctx, img, width, height);
  } else {
    const video = document.createElement("video");
    video.src = clip.url;
    video.crossOrigin = "anonymous";
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
    video.src = "";
    video.load();
  }
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
}
