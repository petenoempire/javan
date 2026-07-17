import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mic2, Upload, Loader2, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/artist/onboarding")({
  head: () => ({ meta: [{ title: "Artist Verification · Javan" }] }),
  component: ArtistOnboarding,
});

function ArtistOnboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stageName, setStageName] = useState("");
  const [genre, setGenre] = useState("");
  const [bio, setBio] = useState("");
  const [spotify, setSpotify] = useState("");
  const [apple, setApple] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [youtube, setYoutube] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: existing, refetch } = useQuery({
    queryKey: ["my-artist-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("artist_applications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    if (!user) return;
    if (!stageName.trim()) {
      toast.error("Stage name is required.");
      return;
    }
    if (!proofFile) {
      toast.error("Please upload proof of your music (a distributor confirmation, Spotify for Artists screenshot, etc).");
      return;
    }

    setSubmitting(true);
    try {
      const ext = proofFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/proof-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("artist-verification")
        .upload(path, proofFile);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("artist_applications").upsert(
        {
          user_id: user.id,
          stage_name: stageName.trim(),
          genre: genre.trim() || null,
          bio: bio.trim() || null,
          spotify_url: spotify.trim() || null,
          apple_music_url: apple.trim() || null,
          soundcloud_url: soundcloud.trim() || null,
          youtube_url: youtube.trim() || null,
          proof_path: path,
          status: "pending",
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;

      toast.success("Application submitted! We'll review it soon.");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black px-5 pt-20 text-xs text-neutral-500">
        Loading...
      </div>
    );
  }

  if (existing && existing.status !== "rejected") {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
          <Link to="/profile" className="text-neutral-400 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-sm font-black">Artist Application</h1>
        </header>
        <div className="px-4 pt-6">
          <ApplicationStatus application={existing} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
        <Link to="/profile" className="text-neutral-400 p-1">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-sm font-black">Become an Artist</h1>
      </header>

      <div className="px-4 pt-5">
        {existing?.status === "rejected" && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
            Your previous application wasn't approved{existing.review_reason ? `: ${existing.review_reason}` : "."} You can submit a new one below.
          </div>
        )}

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-white/5 bg-neutral-900/40 p-4">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-rose-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Mic2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-display text-sm font-black">Upload your own original music</h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              Verified artists can upload tracks they own the rights to and showcase them on their profile.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Field label="Stage / Artist Name *" value={stageName} onChange={setStageName} placeholder="e.g. Funpee" />
          <Field label="Genre" value={genre} onChange={setGenre} placeholder="Afrobeats, Hip-Hop, R&B..." />
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about your music..."
              className="w-full resize-none rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </label>

          <div className="rounded-xl bg-neutral-900/30 border border-white/5 p-3 text-[11px] text-neutral-400">
            Link at least one existing platform to help us verify you're a real artist.
          </div>
          <Field label="Spotify Artist URL" value={spotify} onChange={setSpotify} placeholder="https://open.spotify.com/artist/..." />
          <Field label="Apple Music URL" value={apple} onChange={setApple} placeholder="https://music.apple.com/artist/..." />
          <Field label="SoundCloud URL" value={soundcloud} onChange={setSoundcloud} placeholder="https://soundcloud.com/..." />
          <Field label="YouTube Channel" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@..." />

          <FileField
            label="Proof of ownership *"
            hint="A distributor confirmation email (DistroKid, Ditto, Amuse), a Spotify for Artists dashboard screenshot, or similar."
            file={proofFile}
            onChange={setProofFile}
            accept="image/*,application/pdf"
          />

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3 text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplicationStatus({ application }: { application: any }) {
  const config = {
    pending: {
      Icon: Clock,
      tone: "text-amber-400 bg-amber-500/5 border-amber-500/20",
      label: "Under Review",
      desc: "We're reviewing your application. This usually takes a few days.",
    },
    approved: {
      Icon: CheckCircle2,
      tone: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
      label: "Approved",
      desc: "You're a verified artist! Head to the studio to upload your music.",
    },
  } as const;

  const c = config[application.status as keyof typeof config] ?? config.pending;
  const Icon = c.Icon;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${c.tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-black">{c.label}</span>
      </div>
      <p className="text-xs text-neutral-400 leading-relaxed">{c.desc}</p>
      <div className="rounded-xl bg-neutral-950 border border-white/5 p-3">
        <p className="text-sm font-bold text-white">{application.stage_name}</p>
        {application.genre && <p className="text-xs text-neutral-500 mt-0.5">{application.genre}</p>}
      </div>
      {application.status === "approved" && (
        <Link
          to="/artist/studio"
          className="flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-2.5 text-xs font-bold active:scale-95 transition-all"
        >
          Go to Artist Studio <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
      />
    </label>
  );
}

function FileField({ label, hint, file, onChange, accept }: { label: string; hint: string; file: File | null; onChange: (f: File | null) => void; accept: string }) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</span>
      <p className="mb-2 text-[10px] text-neutral-500">{hint}</p>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-neutral-900/30 px-4 py-6 hover:border-white/20 transition-colors">
        <Upload className="h-5 w-5 text-neutral-500 mb-2" />
        <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="hidden" />
        <span className="text-xs font-bold text-neutral-400">Choose file</span>
        <span className="text-[10px] text-neutral-600 mt-0.5">PDF or image</span>
      </div>
      {file && (
        <div className="mt-2 rounded-lg bg-neutral-900/60 border border-white/5 px-3 py-1.5 truncate text-xs text-fuchsia-400">
          {file.name}
        </div>
      )}
    </label>
  );
}
