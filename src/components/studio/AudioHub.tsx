import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Play, Pause, Mic, Square, Upload, Music2, SlidersHorizontal, Loader2 } from "lucide-react";
import type { MusicSelection } from "@/lib/studio/types";
import { toast } from "sonner";

export interface MixerState {
  original: number;
  music: number;
  voice: number;
}

export function AudioHub({
  open,
  onClose,
  music,
  onMusic,
  mixer,
  onMixer,
  voiceoverUrl,
  onVoiceover,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicSelection | null;
  onMusic: (m: MusicSelection | null) => void;
  mixer: MixerState;
  onMixer: (m: MixerState) => void;
  voiceoverUrl: string | null;
  onVoiceover: (url: string | null) => void;
}) {
  const [tab, setTab] = useState<"library" | "upload" | "voice" | "mixer">("library");
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["studio-sounds"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_tracks")
        .select("id,title,audio_url,artwork_url,album")
        .not("audio_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  useEffect(() => () => audioRef.current?.pause(), []);

  const preview = (id: string, url: string) => {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(url);
    a.volume = 0.9;
    a.play().catch(() => toast.error("Couldn't play this sound"));
    a.onended = () => setPlaying(null);
    audioRef.current = a;
    setPlaying(id);
  };

  const startVoiceover = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        onVoiceover(URL.createObjectURL(blob));
        toast.success("Voiceover recorded");
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopVoiceover = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#08080f] text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={onClose} aria-label="Close sounds" className="rounded-full bg-white/10 p-2 active:scale-90">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">Audio Engine</h2>
        <span className="w-9" />
      </header>

      <div className="mx-4 grid grid-cols-4 rounded-full bg-white/5 p-1 text-[11px] font-bold">
        {([
          ["library", "Sounds"],
          ["upload", "Upload"],
          ["voice", "Voiceover"],
          ["mixer", "Mixer"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-full py-2 transition ${tab === k ? "bg-white text-black" : "text-white/60"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tab === "library" && (
          <div className="space-y-2">
            {isLoading && <Loader2 className="mx-auto h-5 w-5 animate-spin text-white/40" />}
            {!isLoading && (tracks ?? []).length === 0 && (
              <p className="pt-10 text-center text-sm text-white/40">
                No artist sounds published yet. Upload your own audio instead.
              </p>
            )}
            {(tracks ?? []).map((t: any) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 rounded-2xl border p-3 ${
                  music?.id === t.id ? "border-fuchsia-500 bg-fuchsia-500/10" : "border-white/10 bg-white/5"
                }`}
              >
                <button
                  onClick={() => preview(t.id, t.audio_url)}
                  aria-label={playing === t.id ? "Pause preview" : "Play preview"}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 active:scale-90"
                >
                  {playing === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{t.title}</p>
                  <p className="truncate text-[11px] text-white/40">{t.album ?? "Javan Sounds"}</p>
                </div>
                <button
                  onClick={() =>
                    music?.id === t.id
                      ? onMusic(null)
                      : onMusic({ id: t.id, title: t.title, url: t.audio_url })
                  }
                  className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black text-black active:scale-95"
                >
                  {music?.id === t.id ? "Remove" : "Use"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "upload" && (
          <div className="space-y-4 pt-6 text-center">
            <input
              ref={uploadRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                onMusic({ id: "upload", title: f.name, url: URL.createObjectURL(f) });
                toast.success("Audio added to the mix");
              }}
            />
            <Music2 className="mx-auto h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">Bring your own track, stem, or podcast bed.</p>
            <button
              onClick={() => uploadRef.current?.click()}
              className="mx-auto flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black active:scale-95"
            >
              <Upload className="h-4 w-4" /> Choose audio file
            </button>
            {music && <p className="text-xs text-white/50">Selected: {music.title}</p>}
          </div>
        )}

        {tab === "voice" && (
          <div className="space-y-4 pt-6 text-center">
            <Mic className={`mx-auto h-10 w-10 ${recording ? "text-rose-500" : "text-white/20"}`} />
            <p className="text-sm text-white/50">
              {recording ? "Recording your voiceover…" : "Record narration layered over your edit."}
            </p>
            <button
              onClick={recording ? stopVoiceover : startVoiceover}
              className={`mx-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black active:scale-95 ${
                recording ? "bg-rose-600 text-white" : "bg-white text-black"
              }`}
            >
              {recording ? <><Square className="h-4 w-4" /> Stop</> : <><Mic className="h-4 w-4" /> Record</>}
            </button>
            {voiceoverUrl && (
              <div className="space-y-2">
                <audio src={voiceoverUrl} controls className="mx-auto w-full" />
                <button onClick={() => onVoiceover(null)} className="text-xs font-bold text-rose-400">
                  Delete voiceover
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "mixer" && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/50">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Levels
            </div>
            {([
              ["original", "Original sound"],
              ["music", "Music"],
              ["voice", "Voiceover"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-xs font-bold">
                  <label htmlFor={`mix-${key}`}>{label}</label>
                  <span className="text-white/50">{Math.round(mixer[key] * 100)}%</span>
                </div>
                <input
                  id={`mix-${key}`}
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={mixer[key]}
                  onChange={(e) => onMixer({ ...mixer, [key]: Number(e.target.value) })}
                  className="w-full accent-fuchsia-500"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-6">
        <button
          onClick={onClose}
          className="w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3.5 text-sm font-black active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}
