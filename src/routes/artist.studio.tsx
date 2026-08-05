import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Music2, Plus, Trash2, Loader2, Upload, X, Disc, Play, Pause } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/artist/studio")({
  head: () => ({ meta: [{ title: "Artist Studio · Javan" }] }),
  component: ArtistStudio,
});

interface Track {
  id: string;
  title: string;
  audio_url: string;
  cover_url: string | null;
  plays_count: number;
  created_at: string;
}

function ArtistStudio() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const isArtist = (profile as any)?.is_artist === true;

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["artist-tracks", user?.id],
    enabled: !!user && isArtist,
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Track[];
    },
  });

  const togglePlay = (track: Track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(track.audio_url);
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Track removed");
    qc.invalidateQueries({ queryKey: ["artist-tracks"] });
  };

  if (loading || !user) {
    return <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black px-5 pt-20 text-xs text-neutral-500">Loading...</div>;
  }

  if (!isArtist) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
          <Link to="/profile" className="text-neutral-400 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-sm font-black">Artist Studio</h1>
        </header>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-rose-500 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl">
            <Music2 className="h-5 w-5 text-white" />
          </div>
          <h2 className="font-display text-sm font-black">Artist verification required</h2>
          <p className="mt-2 text-xs text-neutral-400 max-w-xs leading-relaxed">
            You need to be a verified artist to upload music. Apply below to get started.
          </p>
          <Link
            to="/artist/onboarding"
            className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-5 rounded-full px-6 py-2.5 text-xs font-bold text-white active:scale-95 transition-transform"
          >
            Apply Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="text-neutral-400 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-sm font-black">Artist Studio</h1>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="bg-gradient-to-r from-fuchsia-500 to-rose-500 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold active:scale-95 transition-transform"
        >
          <Plus className="h-3.5 w-3.5" /> Add Track
        </button>
      </header>

      <div className="px-4 pt-5 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Your Tracks ({tracks?.length ?? 0})
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
          </div>
        ) : !tracks || tracks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-neutral-900/10 p-8 text-center">
            <Music2 className="mx-auto mb-2.5 h-6 w-6 text-neutral-600" />
            <p className="text-xs font-bold text-neutral-400">No tracks yet</p>
            <p className="mt-1 text-[11px] text-neutral-600">Upload your first original track to get started.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-neutral-900/20 divide-y divide-white/5 overflow-hidden">
            {tracks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3">
                {t.cover_url ? (
                  <img src={t.cover_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-rose-600">
                    <Disc className="h-4 w-4 text-white/80" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-bold">{t.title}</p>
                  <p className="text-[10px] text-neutral-500">{t.plays_count} plays</p>
                </div>
                <button onClick={() => togglePlay(t)} className="rounded-full bg-white/10 p-2 active:scale-90">
                  {playingId === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button onClick={() => remove(t.id)} className="p-2 text-neutral-600 hover:text-rose-400 active:scale-90">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddTrackSheet
          userId={user.id}
          onClose={() => {
            setAdding(false);
            qc.invalidateQueries({ queryKey: ["artist-tracks"] });
          }}
        />
      )}
    </div>
  );
}

function AddTrackSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !audioFile) throw new Error("Title and audio file are required");

      const audioExt = audioFile.name.split(".").pop() || "mp3";
      const audioPath = `${userId}/${Date.now()}.${audioExt}`;
      const { error: audioError } = await supabase.storage
        .from("tracks")
        .upload(audioPath, audioFile, { contentType: audioFile.type });
      if (audioError) throw audioError;
      const { data: audioUrlData } = supabase.storage.from("tracks").getPublicUrl(audioPath);

      let coverUrl: string | null = null;
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop() || "jpg";
        const coverPath = `${userId}/cover-${Date.now()}.${coverExt}`;
        const { error: coverError } = await supabase.storage
          .from("tracks")
          .upload(coverPath, coverFile, { contentType: coverFile.type });
        if (coverError) throw coverError;
        const { data: coverUrlData } = supabase.storage.from("tracks").getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      const { error } = await supabase.from("tracks").insert({
        artist_id: userId,
        title: title.trim(),
        audio_url: audioUrlData.publicUrl,
        cover_url: coverUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Track uploaded!");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Upload failed");
    },
  });

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[480px] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-neutral-950 border-t border-white/10 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-black">Upload Track</h3>
          <button onClick={onClose} className="text-neutral-500">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Track title"
          className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
        />

        <input ref={audioInputRef} type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
        <button
          onClick={() => audioInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-4 text-xs font-bold text-neutral-400 hover:border-white/20 transition-colors"
        >
          <Music2 className="h-4 w-4" />
          {audioFile ? audioFile.name : "Choose audio file"}
        </button>

        <input ref={coverInputRef} type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" />
        <button
          onClick={() => coverInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 py-3 text-xs font-bold text-neutral-400 hover:border-white/20 transition-colors"
        >
          {coverFile ? coverFile.name : "Cover art (optional)"}
        </button>

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !title.trim() || !audioFile}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3 text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Upload
            </>
          )}
        </button>
      </div>
    </div>
  );
}
