import { useCallback, useEffect, useRef, useState } from "react";
import {
  X, RotateCw, Timer, Zap, Grid3x3, Sparkles, Wand2, Music2, Images, Trash2, Check,
  Loader2, Circle, PictureInPicture2, Activity, Dog, MonitorPlay,
} from "lucide-react";
import { toast } from "sonner";
import { initFaceLandmarker, initSegmenter } from "@/lib/arEngine";
import { renderARFrame, type ARMode } from "@/lib/arRenderer";
import { COLOR_FILTERS, MODE_LIMITS, makeClip, type Clip, type ColorFilterKey, type StudioMode } from "@/lib/studio/types";
import { ModeCarousel } from "./ModeCarousel";

const AR_MODES: { key: ARMode; label: string; icon: any }[] = [
  { key: "none", label: "None", icon: X },
  { key: "dogEars", label: "Dog Ears", icon: Dog },
  { key: "beauty", label: "Beauty", icon: Sparkles },
  { key: "greenScreen", label: "Green Screen", icon: MonitorPlay },
];

const TIMERS = [0, 3, 10] as const;

export function CameraStudio({
  mode,
  onMode,
  clips,
  onClips,
  onOpenGallery,
  onOpenAudio,
  onOpenTemplates,
  onOpenEditor,
  onClose,
  musicLabel,
}: {
  mode: StudioMode;
  onMode: (m: StudioMode) => void;
  clips: Clip[];
  onClips: (updater: (c: Clip[]) => Clip[]) => void;
  onOpenGallery: () => void;
  onOpenAudio: () => void;
  onOpenTemplates: () => void;
  onOpenEditor: () => void;
  onClose: () => void;
  musicLabel: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pipStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const stabRef = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const timerIntervalRef = useRef<number | null>(null);

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ColorFilterKey>("none");
  const [ar, setAr] = useState<ARMode>("none");
  const [arLoading, setArLoading] = useState(false);
  const [beautify, setBeautify] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(false);
  const [torch, setTorch] = useState(false);
  const [timerSec, setTimerSec] = useState<(typeof TIMERS)[number]>(0);
  const [countdown, setCountdown] = useState(0);
  const [stabilize, setStabilize] = useState(false);
  const [multiCam, setMultiCam] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [panel, setPanel] = useState<"none" | "effects" | "filters" | "beauty">("none");
  const [busy, setBusy] = useState(false);

  const limit = MODE_LIMITS[mode] || 60;

  // ---- camera lifecycle -------------------------------------------------
  const startCamera = useCallback(async () => {
    setError(null);
    setReady(false);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch (err: any) {
      setError(
        err?.name === "NotAllowedError"
          ? "Camera access denied. Enable it in your browser settings to record."
          : "Couldn't access the camera on this device.",
      );
    }
  }, [facing]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      pipStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    };
  }, [startCamera]);

  // secondary camera for picture-in-picture multi-cam
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!multiCam) {
        pipStreamRef.current?.getTracks().forEach((t) => t.stop());
        pipStreamRef.current = null;
        return;
      }
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing === "user" ? "environment" : "user" },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        pipStreamRef.current = s;
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = s;
          await pipVideoRef.current.play();
        }
      } catch {
        setMultiCam(false);
        toast.error("A second camera isn't available on this device");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [multiCam, facing]);

  // AR model loading
  useEffect(() => {
    if (ar === "none") return;
    let cancelled = false;
    setArLoading(true);
    (async () => {
      try {
        if (ar === "greenScreen") await initSegmenter();
        else await initFaceLandmarker();
      } catch {
        if (!cancelled) toast.error("Couldn't load that effect on this device");
      } finally {
        if (!cancelled) setArLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ar]);

  // gyro-assisted stabilization offsets
  useEffect(() => {
    if (!stabilize) return;
    const onMotion = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity;
      if (!g) return;
      const s = stabRef.current;
      s.sx = s.sx * 0.85 + (g.x ?? 0) * 0.15;
      s.sy = s.sy * 0.85 + (g.y ?? 0) * 0.15;
      s.x = Math.max(-24, Math.min(24, -s.sx * 3));
      s.y = Math.max(-24, Math.min(24, s.sy * 3));
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [stabilize]);

  // torch
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.applyConstraints({ advanced: [{ torch } as any] } as any).catch(() => {
      if (torch) {
        setTorch(false);
        toast.error("Flash isn't supported on this camera");
      }
    });
  }, [torch]);

  // render loop
  useEffect(() => {
    if (!ready) return;
    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        renderARFrame(canvas, video, { mode: ar, backgroundImage: bgImageRef.current }, performance.now());

        const ctx = canvas.getContext("2d");
        if (ctx) {
          const s = stabRef.current;
          if (zoom > 1 || stabilize) {
            const w = canvas.width;
            const h = canvas.height;
            const snapshot = ctx.getImageData(0, 0, w, h);
            const tmp = document.createElement("canvas");
            tmp.width = w;
            tmp.height = h;
            tmp.getContext("2d")!.putImageData(snapshot, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const z = Math.max(zoom, stabilize ? 1.08 : 1);
            const dw = w * z;
            const dh = h * z;
            ctx.drawImage(tmp, (w - dw) / 2 + (stabilize ? s.x : 0), (h - dh) / 2 + (stabilize ? s.y : 0), dw, dh);
          }
          if (beautify > 0) {
            ctx.save();
            ctx.globalAlpha = Math.min(0.55, beautify * 0.55);
            ctx.filter = `blur(${1 + beautify * 5}px) saturate(1.1) brightness(${1 + beautify * 0.12})`;
            ctx.drawImage(canvas, 0, 0);
            ctx.restore();
            ctx.filter = "none";
          }
          const pip = pipVideoRef.current;
          if (multiCam && pip && pip.videoWidth > 0) {
            const pw = canvas.width * 0.28;
            const ph = (pw * pip.videoHeight) / pip.videoWidth;
            ctx.save();
            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.lineWidth = 4;
            ctx.strokeRect(canvas.width - pw - 24, 24, pw, ph);
            ctx.drawImage(pip, canvas.width - pw - 24, 24, pw, ph);
            ctx.restore();
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, ar, zoom, beautify, stabilize, multiCam]);

  // ---- capture ----------------------------------------------------------
  const addClip = async (blob: Blob, kind: "video" | "image") => {
    setBusy(true);
    const clip = await makeClip(blob, kind);
    clip.filter = filter;
    onClips((prev) => [...prev, clip]);
    setBusy(false);
    if ("vibrate" in navigator) navigator.vibrate?.(15);
  };

  const shootPhoto = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.filter = COLOR_FILTERS[filter].css;
    ctx.drawImage(canvas, 0, 0);
    out.toBlob((b) => b && addClip(b, "image"), "image/jpeg", 0.92);
  };

  const beginRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas || !streamRef.current) return;
    const cStream = canvas.captureStream(30);
    streamRef.current.getAudioTracks().forEach((t) => cStream.addTrack(t));
    chunksRef.current = [];
    const rec = new MediaRecorder(cStream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => addClip(new Blob(chunksRef.current, { type: "video/webm" }), "video");
    recorderRef.current = rec;
    rec.start();
    setRecording(true);
    setSeconds(0);
    timerIntervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= limit) {
          stopRecording();
          return limit;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
  };

  const runWithTimer = (fn: () => void) => {
    if (timerSec === 0) return fn();
    setCountdown(timerSec);
    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          fn();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const onShutter = () => {
    if (recording) return stopRecording();
    if (mode === "photo") return runWithTimer(shootPhoto);
    runWithTimer(beginRecording);
  };

  const totalRecorded = clips.length;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <input
        ref={bgInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const img = new Image();
          img.onload = () => (bgImageRef.current = img);
          img.src = URL.createObjectURL(f);
        }}
      />

      {/* Full-bleed camera */}
      <div className="absolute inset-0">
        {error ? (
          <div className="flex flex-col h-full items-center justify-center px-10 text-center text-sm text-white/60 gap-4">
            <p className="max-w-md">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={startCamera}
                className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs active:scale-95 transition-transform shadow-lg"
              >
                Retry Camera
              </button>
              <button
                onClick={onOpenGallery}
                className="px-5 py-2.5 rounded-full bg-white/15 text-white font-bold text-xs active:scale-95 transition-transform border border-white/20"
              >
                Upload from Gallery
              </button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="hidden" />
            <video ref={pipVideoRef} autoPlay playsInline muted className="hidden" />
            <canvas
              ref={canvasRef}
              className="h-full w-full object-cover"
              style={{ filter: COLOR_FILTERS[filter].css, transform: facing === "user" ? "scaleX(-1)" : "none" }}
            />
          </>
        )}
        {grid && (
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        )}
      </div>

      {/* Top HUD */}
      <div className="relative z-10 flex items-start justify-between px-4 pt-5">
        <button onClick={onClose} aria-label="Close camera" className="rounded-full bg-black/45 p-2.5 active:scale-90">
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onOpenAudio}
            className="flex max-w-[58vw] items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-xs font-bold active:scale-95"
          >
            <Music2 className="h-3.5 w-3.5" />
            <span className="truncate">{musicLabel ?? "Add sound"}</span>
          </button>
          {recording && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")} / {limit}s
            </span>
          )}
          {arLoading && (
            <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading effect
            </span>
          )}
        </div>

        <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} aria-label="Flip camera" className="rounded-full bg-black/45 p-2.5 active:scale-90">
          <RotateCw className="h-5 w-5" />
        </button>
      </div>

      {/* Right action rail */}
      <div className="absolute right-3 top-24 z-10 flex flex-col gap-3">
        <RailButton icon={Timer} label={timerSec === 0 ? "Timer" : `${timerSec}s`} active={timerSec !== 0}
          onClick={() => setTimerSec(TIMERS[(TIMERS.indexOf(timerSec) + 1) % TIMERS.length])} />
        <RailButton icon={Zap} label="Flash" active={torch} onClick={() => setTorch((t) => !t)} />
        <RailButton icon={Grid3x3} label="Grid" active={grid} onClick={() => setGrid((g) => !g)} />
        <RailButton icon={Sparkles} label="Beauty" active={beautify > 0} onClick={() => setPanel((p) => (p === "beauty" ? "none" : "beauty"))} />
        <RailButton icon={Wand2} label="Effects" active={ar !== "none"} onClick={() => setPanel((p) => (p === "effects" ? "none" : "effects"))} />
        <RailButton icon={Activity} label="Stabil." active={stabilize} onClick={() => setStabilize((s) => !s)} />
        <RailButton icon={PictureInPicture2} label="Dual" active={multiCam} onClick={() => setMultiCam((m) => !m)} />
        <RailButton icon={Wand2} label="Templates" onClick={onOpenTemplates} />
      </div>

      {/* Zoom rail */}
      <div className="absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-2">
        <span className="text-[10px] font-black">{zoom.toFixed(1)}x</span>
        <input
          aria-label="Zoom"
          type="range"
          min={1}
          max={4}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-32 accent-white"
          style={{ writingMode: "vertical-lr" as any, direction: "rtl" }}
        />
      </div>

      {countdown > 0 && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="text-8xl font-black drop-shadow-lg">{countdown}</span>
        </div>
      )}

      {/* Bottom stack */}
      <div className="relative z-10 mt-auto space-y-3 pb-6">
        {panel === "beauty" && (
          <div className="mx-5 rounded-2xl bg-black/60 p-4 backdrop-blur">
            <div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-widest">
              <label htmlFor="beauty">Beautify</label>
              <span>{Math.round(beautify * 100)}%</span>
            </div>
            <input id="beauty" type="range" min={0} max={1} step={0.05} value={beautify}
              onChange={(e) => setBeautify(Number(e.target.value))} className="w-full accent-fuchsia-500" />
          </div>
        )}

        {panel === "effects" && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
            {AR_MODES.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setAr(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black active:scale-95 ${
                  ar === key ? "bg-white text-black" : "border border-white/20 bg-black/45"
                }`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
            {ar === "greenScreen" && (
              <button onClick={() => bgInputRef.current?.click()} className="shrink-0 rounded-full bg-white/15 px-3 py-2 text-[11px] font-black">
                Background
              </button>
            )}
          </div>
        )}

        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
          {(Object.keys(COLOR_FILTERS) as ColorFilterKey[]).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold active:scale-95 ${
                filter === k ? "bg-white text-black" : "border border-white/20 bg-black/40"
              }`}>
              {COLOR_FILTERS[k].label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-8">
          <button onClick={onOpenGallery} aria-label="Open gallery" className="flex flex-col items-center gap-1 active:scale-90">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <Images className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-bold">Upload</span>
          </button>

          <button
            onClick={onShutter}
            disabled={!!error || busy}
            aria-label={recording ? "Stop recording" : mode === "photo" ? "Take photo" : "Start recording"}
            className="relative flex h-[86px] w-[86px] items-center justify-center rounded-full border-[5px] border-white/85 active:scale-95 disabled:opacity-40"
          >
            <span
              className={`transition-all ${
                recording ? "h-8 w-8 rounded-lg bg-rose-600" : "h-16 w-16 rounded-full bg-rose-500"
              }`}
            />
            {busy && <Loader2 className="absolute h-6 w-6 animate-spin" />}
          </button>

          <div className="flex flex-col items-center gap-1">
            {totalRecorded > 0 ? (
              <>
                <button onClick={onOpenEditor} aria-label="Open editor" className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 active:scale-90">
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onClips((c) => c.slice(0, -1))}
                  className="flex items-center gap-1 text-[10px] font-bold text-white/70"
                >
                  <Trash2 className="h-3 w-3" /> {totalRecorded}
                </button>
              </>
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/25">
                <Circle className="h-5 w-5" />
              </span>
            )}
          </div>
        </div>

        <ModeCarousel value={mode} onChange={onMode} disabled={recording} />
      </div>
    </div>
  );
}

function RailButton({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-14 flex-col items-center gap-1 active:scale-90">
      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? "bg-white text-black" : "bg-black/45"}`}>
        <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
      </span>
      <span className="text-[9px] font-bold">{label}</span>
    </button>
  );
}
