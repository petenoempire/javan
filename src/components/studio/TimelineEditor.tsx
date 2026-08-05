import { useEffect, useMemo, useRef, useState } from "react";
import {
  X, Scissors, Gauge, Trash2, Type, Music2, Sparkles, ArrowRight, Play, Pause,
  ChevronLeft, ChevronRight, Volume2, Wand2,
} from "lucide-react";
import {
  COLOR_FILTERS, clipLength, projectDuration, uid,
  type Clip, type ColorFilterKey, type MusicSelection, type TextOverlay,
} from "@/lib/studio/types";
import { toast } from "sonner";

type Tool = "trim" | "speed" | "filters" | "text" | "volume";

const SPEEDS = [0.3, 0.5, 1, 1.5, 2, 3];

export function TimelineEditor({
  clips,
  setClips,
  overlays,
  setOverlays,
  music,
  onOpenAudio,
  onOpenTemplates,
  onClose,
  onNext,
}: {
  clips: Clip[];
  setClips: (updater: (c: Clip[]) => Clip[]) => void;
  overlays: TextOverlay[];
  setOverlays: (updater: (o: TextOverlay[]) => TextOverlay[]) => void;
  music: MusicSelection | null;
  onOpenAudio: () => void;
  onOpenTemplates: () => void;
  onClose: () => void;
  onNext: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [tool, setTool] = useState<Tool>("trim");
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<number | null>(null);

  const active = clips[activeIndex] ?? null;
  const total = useMemo(() => projectDuration(clips), [clips]);

  useEffect(() => {
    if (activeIndex > clips.length - 1) setActiveIndex(Math.max(0, clips.length - 1));
  }, [clips.length, activeIndex]);

  // Sequential preview playback across clips
  useEffect(() => {
    if (imageTimerRef.current) window.clearTimeout(imageTimerRef.current);
    if (!playing || !active) return;
    if (active.kind === "image") {
      imageTimerRef.current = window.setTimeout(() => advance(), clipLength(active) * 1000);
      return () => {
        if (imageTimerRef.current) window.clearTimeout(imageTimerRef.current);
      };
    }
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = active.speed;
    v.volume = active.volume;
    if (v.currentTime < active.trimStart || v.currentTime > active.trimEnd) v.currentTime = active.trimStart;
    v.play().catch(() => setPlaying(false));
    const onTime = () => {
      if (v.currentTime >= active.trimEnd) advance();
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [playing, activeIndex, active?.speed, active?.trimStart, active?.trimEnd, active?.volume]);

  const advance = () => {
    if (activeIndex < clips.length - 1) setActiveIndex((i) => i + 1);
    else {
      setPlaying(false);
      setActiveIndex(0);
    }
  };

  const patch = (p: Partial<Clip>) =>
    setClips((prev) => prev.map((c, i) => (i === activeIndex ? { ...c, ...p } : c)));

  const removeClip = (i: number) => {
    setClips((prev) => prev.filter((_, idx) => idx !== i));
    toast.success("Clip removed");
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= clips.length) return;
    setClips((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setActiveIndex(j);
  };

  const split = () => {
    if (!active || active.kind !== "video") {
      toast.error("Only video clips can be split");
      return;
    }
    const at = videoRef.current?.currentTime ?? (active.trimStart + active.trimEnd) / 2;
    if (at <= active.trimStart + 0.2 || at >= active.trimEnd - 0.2) {
      toast.error("Move the playhead into the clip to split");
      return;
    }
    setClips((prev) => {
      const next = [...prev];
      const a = { ...active, trimEnd: at };
      const b = { ...active, id: uid(), trimStart: at };
      next.splice(activeIndex, 1, a, b);
      return next;
    });
    toast.success("Clip split");
  };

  const addText = () => {
    const start = clips.slice(0, activeIndex).reduce((s, c) => s + clipLength(c), 0);
    setOverlays((prev) => [
      ...prev,
      {
        id: uid(),
        text: "Tap to edit",
        start,
        end: Math.min(total, start + Math.max(2, active ? clipLength(active) : 3)),
        x: 0.5,
        y: 0.4,
        size: 64,
        color: "#ffffff",
      },
    ]);
    setTool("text");
  };

  if (!active) {
    return (
      <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-sm text-white/60">Your timeline is empty.</p>
        <button onClick={onClose} className="rounded-full bg-white px-5 py-3 text-sm font-black text-black">
          Back to camera
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[65] flex flex-col bg-black text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} aria-label="Close editor" className="rounded-full bg-white/10 p-2 active:scale-90">
          <X className="h-5 w-5" />
        </button>
        <div className="text-[11px] font-black uppercase tracking-widest text-white/60">
          {total.toFixed(1)}s · {clips.length} clip{clips.length === 1 ? "" : "s"}
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-black text-black active:scale-95"
        >
          Next <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Preview */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {active.kind === "video" ? (
          <video
            key={active.id}
            ref={videoRef}
            src={active.url}
            playsInline
            className="h-full w-full object-contain"
            style={{ filter: COLOR_FILTERS[active.filter].css }}
          />
        ) : (
          <img
            src={active.url}
            alt="Clip preview"
            className="h-full w-full object-contain"
            style={{ filter: COLOR_FILTERS[active.filter].css }}
          />
        )}

        {overlays.map((o) => (
          <span
            key={o.id}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
            style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%`, color: o.color, fontSize: o.size / 4 }}
          >
            {o.text}
          </span>
        ))}

        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause preview" : "Play preview"}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 p-3 active:scale-90"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      </div>

      {/* Timeline strip */}
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-3">
        {clips.map((c, i) => (
          <div key={c.id} className="relative shrink-0">
            <button
              onClick={() => {
                setActiveIndex(i);
                setPlaying(false);
              }}
              className={`h-16 overflow-hidden rounded-lg border-2 ${
                i === activeIndex ? "border-fuchsia-500" : "border-white/15"
              }`}
              style={{ width: Math.max(38, Math.min(120, clipLength(c) * 14)) }}
            >
              {c.kind === "video" ? (
                <video src={c.url} muted className="h-full w-full object-cover" />
              ) : (
                <img src={c.url} alt="" className="h-full w-full object-cover" />
              )}
            </button>
            {i === activeIndex && (
              <div className="absolute -top-2 right-0 flex gap-1">
                <button onClick={() => move(i, -1)} aria-label="Move clip left" className="rounded-full bg-white/20 p-0.5">
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button onClick={() => move(i, 1)} aria-label="Move clip right" className="rounded-full bg-white/20 p-0.5">
                  <ChevronRight className="h-3 w-3" />
                </button>
                <button onClick={() => removeClip(i)} aria-label="Delete clip" className="rounded-full bg-rose-600 p-0.5">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tool panel */}
      <div className="max-h-56 overflow-y-auto border-t border-white/10 px-4 py-3">
        {tool === "trim" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/50">
              <span>Trim · {clipLength(active).toFixed(1)}s</span>
              <button onClick={split} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white">
                <Scissors className="h-3 w-3" /> Split
              </button>
            </div>
            <label className="sr-only" htmlFor="e-start">Start</label>
            <input id="e-start" type="range" min={0} max={Math.max(0.2, active.duration - 0.2)} step={0.05}
              value={active.trimStart} onChange={(e) => patch({ trimStart: Math.min(Number(e.target.value), active.trimEnd - 0.2) })}
              className="w-full accent-fuchsia-500" />
            <label className="sr-only" htmlFor="e-end">End</label>
            <input id="e-end" type="range" min={0.2} max={active.duration} step={0.05}
              value={active.trimEnd} onChange={(e) => patch({ trimEnd: Math.max(Number(e.target.value), active.trimStart + 0.2) })}
              className="w-full accent-fuchsia-500" />
          </div>
        )}

        {tool === "speed" && (
          <div className="flex gap-2">
            {SPEEDS.map((s) => (
              <button key={s} onClick={() => patch({ speed: s })}
                className={`flex-1 rounded-xl py-2 text-xs font-black active:scale-95 ${
                  active.speed === s ? "bg-white text-black" : "bg-white/10 text-white/70"
                }`}>
                {s}x
              </button>
            ))}
          </div>
        )}

        {tool === "filters" && (
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {(Object.keys(COLOR_FILTERS) as ColorFilterKey[]).map((k) => (
              <button key={k} onClick={() => patch({ filter: k })}
                className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-black active:scale-95 ${
                  active.filter === k ? "bg-white text-black" : "bg-white/10 text-white/70"
                }`}>
                {COLOR_FILTERS[k].label}
              </button>
            ))}
          </div>
        )}

        {tool === "volume" && (
          <div>
            <div className="mb-1 flex justify-between text-xs font-bold">
              <label htmlFor="clip-vol">Clip volume</label>
              <span className="text-white/50">{Math.round(active.volume * 100)}%</span>
            </div>
            <input id="clip-vol" type="range" min={0} max={1} step={0.05} value={active.volume}
              onChange={(e) => patch({ volume: Number(e.target.value) })} className="w-full accent-fuchsia-500" />
            <button onClick={onOpenAudio} className="mt-3 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold">
              <Music2 className="h-3.5 w-3.5" /> {music ? music.title : "Add sound"}
            </button>
          </div>
        )}

        {tool === "text" && (
          <div className="space-y-3">
            <button onClick={addText} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-black active:scale-95">
              <Type className="h-3.5 w-3.5" /> Add text
            </button>
            {overlays.map((o) => (
              <div key={o.id} className="space-y-2 rounded-2xl bg-white/5 p-3">
                <div className="flex gap-2">
                  <input
                    value={o.text}
                    aria-label="Overlay text"
                    onChange={(e) => setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)))}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <input
                    type="color"
                    aria-label="Text color"
                    value={o.color}
                    onChange={(e) => setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, color: e.target.value } : x)))}
                    className="h-9 w-9 rounded-lg border-0 bg-transparent"
                  />
                  <button onClick={() => setOverlays((prev) => prev.filter((x) => x.id !== o.id))} aria-label="Remove text" className="rounded-xl bg-rose-600/80 px-2">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-white/50">
                  <div>
                    <label htmlFor={`x-${o.id}`}>Horizontal</label>
                    <input id={`x-${o.id}`} type="range" min={0.1} max={0.9} step={0.01} value={o.x}
                      onChange={(e) => setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, x: Number(e.target.value) } : x)))}
                      className="w-full accent-fuchsia-500" />
                  </div>
                  <div>
                    <label htmlFor={`y-${o.id}`}>Vertical</label>
                    <input id={`y-${o.id}`} type="range" min={0.1} max={0.9} step={0.01} value={o.y}
                      onChange={(e) => setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, y: Number(e.target.value) } : x)))}
                      className="w-full accent-fuchsia-500" />
                  </div>
                  <div>
                    <label htmlFor={`s-${o.id}`}>Size</label>
                    <input id={`s-${o.id}`} type="range" min={24} max={160} step={2} value={o.size}
                      onChange={(e) => setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, size: Number(e.target.value) } : x)))}
                      className="w-full accent-fuchsia-500" />
                  </div>
                  <div>
                    <label htmlFor={`t-${o.id}`}>Ends at {o.end.toFixed(1)}s</label>
                    <input id={`t-${o.id}`} type="range" min={0.5} max={Math.max(1, total)} step={0.1} value={o.end}
                      onChange={(e) => setOverlays((prev) => prev.map((x) => (x.id === o.id ? { ...x, end: Number(e.target.value) } : x)))}
                      className="w-full accent-fuchsia-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool bar */}
      <nav className="flex items-center justify-around border-t border-white/10 px-2 py-3">
        {([
          ["trim", Scissors, "Trim"],
          ["speed", Gauge, "Speed"],
          ["filters", Sparkles, "Filters"],
          ["text", Type, "Text"],
          ["volume", Volume2, "Audio"],
        ] as const).map(([k, Icon, label]) => (
          <button key={k} onClick={() => setTool(k)}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold active:scale-90 ${
              tool === k ? "text-white" : "text-white/45"
            }`}>
            <Icon className="h-5 w-5" /> {label}
          </button>
        ))}
        <button onClick={onOpenTemplates} className="flex flex-col items-center gap-1 text-[10px] font-bold text-white/45 active:scale-90">
          <Wand2 className="h-5 w-5" /> Templates
        </button>
      </nav>
    </div>
  );
}
