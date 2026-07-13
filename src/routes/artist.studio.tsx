import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Music2, Plus, Trash2, Loader2, Upload, X, Disc, BarChart3, Radio, DatabaseZap } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/artist/studio")({
  head: () => ({ meta: [{ title: "Production Studio · Javan" }] }),
  component: ArtistStudio,
});

function ArtistStudio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: artist } = useQuery({
    queryKey: ["my-artist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("artist_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: tracks } = useQuery({
    queryKey: ["artist-tracks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("audio_tracks").select("*")
        .eq("artist_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (loading || !user) return <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black px-5 pt-20 text-xs font-mono text-neutral-500">INITIALIZING_STUDIO_METRICS…</div>;

  if (!artist || artist.status !== "approved") {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24 selection:bg-rose-500/30">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
          <Link to="/profile" className="text-neutral-400 p-1"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="font-display text-xs font-black uppercase tracking-widest text-neutral-400">Security Gate</h1>
        </header>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-rose-500 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow animate-pulse">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-display text-sm font-black uppercase tracking-wider">Access Parameters Blocked</h2>
          <p className="mt-2 text-[11px] text-neutral-400 max-w-xs leading-normal font-medium">
            {artist?.status === "pending" ? "Your identity credentials are undergoing systemic validation audit pools right now." : "Verify your catalog profile identity ledger array to provision music assets."}
          </p>
          <Link to="/artist/onboarding" className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-5 rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-glow active:scale-98 transition-transform">
            {artist?.status === "pending" ? "Audit Console Status" : "Begin Onboarding"}
          </Link>
        </div>
      </div>
    );
  }

  const remove = async (id: string) => {
    if (!confirm("De-register track reference from public asset trays?")) return;
    const { error } = await supabase.from("audio_tracks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Track node severed from global distribution index maps.");
    qc.invalidateQueries({ queryKey: ["artist-tracks"] });
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24 selection:bg-rose-500/30 select-none">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="text-neutral-400 p-1"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="font-display text-xs font-black uppercase tracking-widest text-neutral-400">Studio Analytics Engine</h1>
        </div>
        <button onClick={() => setAdding(true)} className="bg-gradient-to-r from-fuchsia-500 to-rose-500 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-glow active:scale-95 transition-transform">
          <Plus className="h-3 w-3" /> Link Track
        </button>
      </header>

      <div className="px-4 pt-5 space-y-4">
        <div className="border border-white/5 bg-neutral-900/40 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="font-display text-sm font-black uppercase tracking-wider">{artist.stage_name}</div>
            {artist.genre && <div className="text-[9px] font-mono font-bold uppercase text-neutral-500 tracking-wider mt-0.5">{artist.genre} Node Platform</div>}
          </div>
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider">
            <Radio className="h-3 w-3 animate-pulse" /> Live
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-neutral-900/20 border border-white/5 rounded-xl p-3">
            <div className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Sound Ingestion Usage</div>
            <div className="text-base font-black tracking-tight mt-1">1,482 <span className="text-[10px] text-emerald-400 font-mono font-bold ml-1">+12%</span></div>
          </div>
          <div className="bg-neutral-900/20 border border-white/5 rounded-xl p-3">
            <div className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Aggregate Streams</div>
            <div className="text-base font-black tracking-tight mt-1">294.1K <span className="text-[10px] text-rose-500 font-mono font-bold ml-1">Live</span></div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-0.5 pt-2">
          <DatabaseZap className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Indexed Sound Catalog Assets ({tracks?.length ?? 0})</span>
        </div>

        {!tracks || tracks.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center bg-neutral-900/10">
            <Music2 className="mx-auto mb-2.5 h-5 w-5 text-neutral-600" />
            <div className="text-xs font-black uppercase tracking-wide text-neutral-400">Catalog Registry Empty</div>
            <div className="mt-1 text-[11px] text-neutral-600 font-medium max-w-xs mx-auto leading-normal">No audio traces tied to this identifier node. Sync an ISRC to generate assets.</div>
          </div>
        ) : (
          <div className="border border-white/5 bg-neutral-900/20 rounded-2xl overflow-hidden divide-y divide-white/5">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 transition-colors hover:bg-neutral-900/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-neutral-950 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-rose-400 relative group">
                    <Disc className="h-4 w-4 animate-spin-slow group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black tracking-tight text-white">{t.title}</div>
                    <div className="truncate text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider mt-0.5">ISRC: {t.isrc}</div>
                  </div>
                </div>
                <button onClick={() => remove(t.id)} className="text-neutral-600 hover:text-rose-400 transition-colors p-2 active:scale-90" aria-label="Delete Track Parameter">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddTrackSheet onClose={() => { setAdding(false); qc.invalidateQueries({ queryKey: ["artist-tracks"] }); }} userId={user.id} artistName={artist.stage_name} />
      )}
    </div>
  );
}

function AddTrackSheet({ onClose, userId, artistName }: { onClose: () => void; userId: string; artistName: string }) {
  const [title, setTitle] = useState("");
  const [isrc, setIsrc] = useState("");
  const [duration, setDuration] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title || !isrc || !audioUrl) { toast.error("Title, ISRC designation code, and CDN audio asset vectors are required."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("audio_tracks").insert({
        artist_id: userId,
        title: title.trim(),
        artist_name: artistName,
        isrc: isrc.trim().toUpperCase(),
        audio_url: audioUrl.trim(),
        duration_seconds: duration ? parseFloat(duration) : 30.00,
      });
      if (error) throw error;
      toast.success(`Track "${title}" loaded successfully into ecosystem sound array vectors.`);
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Database ingestion layer rejected operational payload.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-neutral-950 border-t border-white/10 max-h-[85dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl p-5 space-y-4 shadow-2xl no-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h3 className="font-display text-xs font-black uppercase tracking-widest text-neutral-400">Ingest Distributed Track Node</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
        </div>
        
        <div className="space-y-4 pt-1">
          <F label="Track Title Title *" v={title} on={setTitle} placeholder="e.g. Drvg Abuse" />
          <F label="Official Distributed ISRC String *" v={isrc} on={setIsrc} placeholder="e.g. USSM12345678" />
          <F label="High Quality Audio Snippet URL CDN *" v={audioUrl} on={setAudioUrl} placeholder="https://cdn.dittomusic.com/assets/track.mp3" />
          <F label="Snippet Segment Duration Core (seconds)" v={duration} on={setDuration} placeholder="e.g. 30.00" />
          
          <button onClick={save} disabled={saving}
            className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-3 w-full rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-glow disabled:opacity-40 active:scale-98 transition-transform"
          >
            {saving ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> EXECUTING_CATALOG_INGESTION…</span> : "Commit Sync Parameters"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, v, on, placeholder }: { label: string; v: string; on: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-mono font-black uppercase tracking-widest text-neutral-500">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-white/5 bg-neutral-900/50 px-4 py-2.5 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-rose-500 transition-shadow placeholder:text-neutral-700" />
    </label>
  );
}
