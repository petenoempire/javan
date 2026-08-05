import { useEffect, useRef, useState, useMemo } from "react";
import { X, Check, Loader2, ImagePlus, Scissors } from "lucide-react";
import { makeClip, type Clip } from "@/lib/studio/types";
import { toast } from "sonner";

interface Item {
  id: string;
  file: File;
  url: string;
  kind: "video" | "image";
  duration: number;
  trimStart: number;
  trimEnd: number;
  selected: boolean;
  thumbnailUrl?: string;
}

// Global cache for zero-latency asset loading
const metadataCache = new Map<string, { duration: number; thumbnailUrl?: string }>();

export function GalleryPicker({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (clips: Clip[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && items.length === 0) inputRef.current?.click();
  }, [open]);

  const readFiles = async (files: FileList) => {
    setBusy(true);
    const next: Item[] = [];
    for (const file of Array.from(files)) {
      const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
      const kind = file.type.startsWith("video/") ? "video" : "image";
      const url = URL.createObjectURL(file);
      
      let duration = 3;
      let thumbnailUrl: string | undefined;

      if (kind === "video") {
        if (metadataCache.has(cacheKey)) {
          const cached = metadataCache.get(cacheKey)!;
          duration = cached.duration;
          thumbnailUrl = cached.thumbnailUrl;
        } else {
          duration = await new Promise<number>((resolve) => {
            const v = document.createElement("video");
            v.preload = "metadata";
            v.onloadedmetadata = () =>
              resolve(Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 5);
            v.onerror = () => resolve(5);
            v.src = url;
          });
          
          // Generate a quick thumbnail for the picker
          thumbnailUrl = await new Promise<string | undefined>((resolve) => {
            const v = document.createElement("video");
            v.src = url;
            v.muted = true;
            v.currentTime = 0.1;
            v.onseeked = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 160;
              canvas.height = 160;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                const s = Math.min(v.videoWidth, v.videoHeight);
                ctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, 160, 160);
                resolve(canvas.toDataURL("image/jpeg", 0.7));
              } else resolve(undefined);
            };
            v.onerror = () => resolve(undefined);
          });

          metadataCache.set(cacheKey, { duration, thumbnailUrl });
        }
      }

      next.push({
        id: Math.random().toString(36).slice(2),
        file,
        url,
        kind,
        duration,
        trimStart: 0,
        trimEnd: duration,
        selected: true,
        thumbnailUrl,
      });
    }
    setItems((prev) => [...prev, ...next]);
    setPreviewId(next[0]?.id ?? null);
    setBusy(false);
  };

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)));

  const patch = (id: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const confirm = async () => {
    const chosen = items.filter((i) => i.selected);
    if (chosen.length === 0) {
      toast.error("Select at least one item");
      return;
    }
    setBusy(true);
    const clips: Clip[] = [];
    for (const i of chosen) {
      const clip = await makeClip(i.file, i.kind);
      clip.trimStart = i.trimStart;
      clip.trimEnd = i.trimEnd;
      clips.push(clip);
    }
    setBusy(false);
    onAdd(clips);
    setItems([]);
    onClose();
  };

  if (!open) return null;
  const preview = items.find((i) => i.id === previewId) ?? null;
  const selectedCount = items.filter((i) => i.selected).length;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black text-white">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && readFiles(e.target.files)}
      />
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} aria-label="Close gallery" className="rounded-full bg-white/10 p-2 active:scale-90">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">Smart Picker</h2>
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-white/10 p-2 active:scale-90"
          aria-label="Add more media"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden bg-black">
        {preview ? (
          preview.kind === "video" ? (
            <video key={preview.id} src={preview.url} autoPlay muted loop playsInline className="h-full w-full object-contain" />
          ) : (
            <img src={preview.url} alt="Selected media preview" className="h-full w-full object-contain" />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-10 text-center text-sm text-white/50">
            {busy ? "Reading media…" : "Pick photos or videos from your device to start."}
          </div>
        )}
      </div>

      {preview?.kind === "video" && (
        <div className="space-y-2 px-5 py-3">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/60">
            <Scissors className="h-3.5 w-3.5" /> Pre-trim · {(preview.trimEnd - preview.trimStart).toFixed(1)}s
          </div>
          <label className="sr-only" htmlFor="trim-start">Trim start</label>
          <input
            id="trim-start"
            type="range"
            min={0}
            max={Math.max(0.1, preview.duration - 0.2)}
            step={0.1}
            value={preview.trimStart}
            onChange={(e) =>
              patch(preview.id, { trimStart: Math.min(Number(e.target.value), preview.trimEnd - 0.2) })
            }
            className="w-full accent-fuchsia-500"
          />
          <label className="sr-only" htmlFor="trim-end">Trim end</label>
          <input
            id="trim-end"
            type="range"
            min={0.2}
            max={preview.duration}
            step={0.1}
            value={preview.trimEnd}
            onChange={(e) =>
              patch(preview.id, { trimEnd: Math.max(Number(e.target.value), preview.trimStart + 0.2) })
            }
            className="w-full accent-fuchsia-500"
          />
        </div>
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => {
              setPreviewId(i.id);
              toggle(i.id);
            }}
            className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all active:scale-95 ${
              i.selected ? "border-fuchsia-500" : "border-white/15"
            }`}
          >
            {i.thumbnailUrl ? (
              <img src={i.thumbnailUrl} alt="" className="h-full w-full object-cover" />
            ) : i.kind === "video" ? (
              <video src={i.url} muted className="h-full w-full object-cover" />
            ) : (
              <img src={i.url} alt="" className="h-full w-full object-cover" />
            )}
            {i.selected && (
              <span className="absolute right-1 top-1 rounded-full bg-fuchsia-500 p-0.5">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={confirm}
          disabled={busy || selectedCount === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3.5 text-sm font-black disabled:opacity-40 active:scale-95"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Add {selectedCount || ""} to timeline
        </button>
      </div>
    </div>
  );
}
