import { X, Sparkles } from "lucide-react";
import type { ColorFilterKey } from "@/lib/studio/types";

export interface StudioTemplate {
  id: string;
  name: string;
  desc: string;
  beats: number;
  segment: number; // seconds per beat segment
  filter: ColorFilterKey;
  gradient: string;
  captionIdea: string;
}

export const TEMPLATES: StudioTemplate[] = [
  { id: "flash", name: "Flash Cuts", desc: "8 rapid beats · 0.8s each", beats: 8, segment: 0.8, filter: "vivid", gradient: "from-fuchsia-600 to-rose-500", captionIdea: "Blink and you miss it ⚡" },
  { id: "story", name: "Slow Story", desc: "5 beats · 3s each", beats: 5, segment: 3, filter: "cinema", gradient: "from-sky-600 to-indigo-600", captionIdea: "A quiet moment, told slowly." },
  { id: "glow", name: "Soft Glow", desc: "6 beats · 1.5s each", beats: 6, segment: 1.5, filter: "dream", gradient: "from-amber-400 to-pink-500", captionIdea: "Golden hour energy ✨" },
  { id: "noir", name: "Night Noir", desc: "4 beats · 2s each", beats: 4, segment: 2, filter: "noir", gradient: "from-zinc-700 to-zinc-900", captionIdea: "After dark." },
  { id: "retro", name: "Retro Tape", desc: "7 beats · 1.2s each", beats: 7, segment: 1.2, filter: "vintage", gradient: "from-orange-500 to-red-700", captionIdea: "Rewind ▶︎" },
  { id: "pulse", name: "Pulse Drop", desc: "10 beats · 0.6s each", beats: 10, segment: 0.6, filter: "cool", gradient: "from-cyan-400 to-blue-700", captionIdea: "Wait for the drop 🔊" },
];

export function TemplateHub({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (t: StudioTemplate) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#08080f] text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} aria-label="Close templates" className="rounded-full bg-white/10 p-2 active:scale-90">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">Template Hub</h2>
        <span className="w-9" />
      </header>
      <p className="px-5 pb-3 text-xs text-white/50">
        Templates auto-slice your timeline into beat-synced segments and apply a matching look.
      </p>
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto px-4 pb-6">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onApply(t)}
            className={`flex h-40 flex-col justify-end rounded-3xl bg-gradient-to-br ${t.gradient} p-4 text-left active:scale-95`}
          >
            <Sparkles className="mb-auto h-5 w-5 opacity-90" />
            <span className="text-sm font-black">{t.name}</span>
            <span className="text-[11px] opacity-80">{t.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
