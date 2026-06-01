import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, Music2, ExternalLink } from "lucide-react";

const PLATFORM_ICONS: { key: string; label: string; color: string }[] = [
  { key: "spotify_url", label: "Spotify", color: "text-[#1DB954]" },
  { key: "apple_music_url", label: "Apple Music", color: "text-[#FA243C]" },
  { key: "soundcloud_url", label: "SoundCloud", color: "text-[#FF5500]" },
  { key: "youtube_url", label: "YouTube", color: "text-[#FF0000]" },
];

function formatDuration(s?: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function MusicHub({ artistUserId }: { artistUserId: string }) {
  const { data: artist } = useQuery({
    queryKey: ["artist-profile", artistUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("user_id", artistUserId)
        .eq("status", "approved")
        .maybeSingle();
      return data;
    },
  });

  const { data: tracks } = useQuery({
    queryKey: ["artist-tracks", artistUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_tracks")
        .select("*")
        .eq("artist_user_id", artistUserId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const toggle = (id: string, url: string | null) => {
    if (!url) return;
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(id);
  };

  if (!artist) return null;

  return (
    <div className="space-y-4 pb-8">
      {/* Artist banner */}
      <div className="glass relative overflow-hidden rounded-3xl p-5">
        <div className="bg-gradient-primary pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl" />
        <div className="flex items-start gap-3">
          <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow">
            <Music2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-xl font-bold">{artist.stage_name}</div>
            {artist.genre && <div className="text-xs uppercase tracking-widest text-muted-foreground">{artist.genre}</div>}
            {artist.bio && <p className="mt-2 text-sm text-muted-foreground">{artist.bio}</p>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PLATFORM_ICONS.map((p) => {
            const url = (artist as any)[p.key] as string | null;
            if (!url) return null;
            return (
              <a
                key={p.key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={`glass-strong inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${p.color}`}
              >
                <ExternalLink className="h-3 w-3" /> {p.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Track list */}
      {!tracks || tracks.length === 0 ? (
        <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">
          No tracks released yet.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-3xl">
          {tracks.map((t, i) => {
            const isPlaying = playingId === t.id;
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/40" : ""}`}
              >
                <button
                  onClick={() => toggle(t.id, t.audio_url)}
                  disabled={!t.audio_url}
                  className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl ${
                    t.audio_url ? "bg-gradient-primary shadow-glow" : "bg-muted"
                  } disabled:opacity-50`}
                >
                  {t.artwork_url ? (
                    <img src={t.artwork_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white" />
                    )}
                  </div>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {t.album || artist.stage_name} · {formatDuration(t.duration_seconds)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {PLATFORM_ICONS.map((p) => {
                    const url = (t as any)[p.key] as string | null;
                    if (!url) return null;
                    return (
                      <a
                        key={p.key}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        title={p.label}
                        className={`flex h-7 w-7 items-center justify-center rounded-full bg-muted ${p.color}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
