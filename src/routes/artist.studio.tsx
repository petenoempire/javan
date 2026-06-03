import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Music2, Plus, Trash2, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/artist/studio")({
  head: () => ({ meta: [{ title: "Music Studio · Boogle" }] }),
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
      const { data } = await supabase.from("artist_tracks").select("*")
        .eq("artist_user_id", user!.id).order("position", { ascending: true }).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (loading || !user) return <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background px-5 pt-20 text-sm text-muted-foreground">Loading…</div>;

  if (!artist || artist.status !== "approved") {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
        <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
          <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold">Music Studio</h1>
        </header>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-primary mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
            <Music2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold">Artist account required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {artist?.status === "pending" ? "Your application is under review." : "Apply for an artist account to start uploading tracks."}
          </p>
          <Link to="/artist/onboarding" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            {artist?.status === "pending" ? "View application" : "Become an artist"}
          </Link>
        </div>
      </div>
    );
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this track?")) return;
    const { error } = await supabase.from("artist_tracks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["artist-tracks"] });
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-10 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold">Music Studio</h1>
        </div>
        <button onClick={() => setAdding(true)} className="bg-gradient-primary inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow">
          <Plus className="h-3.5 w-3.5" /> Track
        </button>
      </header>

      <div className="px-5 pt-5">
        <div className="glass mb-4 rounded-2xl p-4">
          <div className="font-display text-lg font-bold">{artist.stage_name}</div>
          {artist.genre && <div className="text-xs uppercase tracking-widest text-muted-foreground">{artist.genre}</div>}
        </div>

        {!tracks || tracks.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center">
            <Music2 className="mx-auto mb-2 h-7 w-7 text-primary" />
            <div className="font-display font-semibold">No tracks yet</div>
            <div className="mt-1 text-xs text-muted-foreground">Add your first single or import streaming links.</div>
          </div>
        ) : (
          <div className="glass overflow-hidden rounded-3xl">
            {tracks.map((t, i) => (
              <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/40" : ""}`}>
                <div className="bg-gradient-primary h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                  {t.artwork_url && <img src={t.artwork_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.title}</div>
                  {t.album && <div className="truncate text-[11px] text-muted-foreground">{t.album}</div>}
                </div>
                <button onClick={() => remove(t.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddTrackSheet onClose={() => { setAdding(false); qc.invalidateQueries({ queryKey: ["artist-tracks"] }); }} userId={user.id} />
      )}
    </div>
  );
}

function AddTrackSheet({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("");
  const [duration, setDuration] = useState("");
  const [spotify, setSpotify] = useState("");
  const [apple, setApple] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [youtube, setYoutube] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadOne = async (f: File, kind: string) => {
    const ext = f.name.split(".").pop();
    const path = `${userId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("artist-media").upload(path, f);
    if (error) throw error;
    return supabase.storage.from("artist-media").getPublicUrl(path).data.publicUrl;
  };

  const save = async () => {
    if (!title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const audio_url = audioFile ? await uploadOne(audioFile, "audio") : null;
      const artwork_url = artFile ? await uploadOne(artFile, "art") : null;
      const { error } = await supabase.from("artist_tracks").insert({
        artist_user_id: userId, title, album: album || null,
        audio_url, artwork_url,
        duration_seconds: duration ? parseInt(duration) : null,
        spotify_url: spotify || null, apple_music_url: apple || null,
        soundcloud_url: soundcloud || null, youtube_url: youtube || null,
      });
      if (error) throw error;
      toast.success("Track added");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-strong max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Add track</h3>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <F label="Title *" v={title} on={setTitle} />
          <F label="Album / EP" v={album} on={setAlbum} />
          <F label="Duration (seconds)" v={duration} on={setDuration} placeholder="e.g. 213" />
          <FileF label="Audio preview (MP3)" file={audioFile} onChange={setAudioFile} accept="audio/*" />
          <FileF label="Album artwork" file={artFile} onChange={setArtFile} accept="image/*" />
          <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Streaming links</div>
          <F label="Spotify" v={spotify} on={setSpotify} />
          <F label="Apple Music" v={apple} on={setApple} />
          <F label="SoundCloud" v={soundcloud} on={setSoundcloud} />
          <F label="YouTube" v={youtube} on={setYoutube} />
          <button onClick={save} disabled={saving}
            className="bg-gradient-primary mt-2 w-full rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
            {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span> : "Save track"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, v, on, placeholder }: { label: string; v: string; on: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function FileF({ label, file, onChange, accept }: { label: string; file: File | null; onChange: (f: File | null) => void; accept: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-3">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="flex-1 bg-transparent text-xs outline-none file:mr-2 file:rounded-full file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:text-foreground" />
      </div>
      {file && <div className="mt-1 truncate text-[11px] text-muted-foreground">{file.name}</div>}
    </label>
  );
}
