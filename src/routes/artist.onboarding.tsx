import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mic2, Upload, Loader2, CheckCircle2, XCircle, Clock, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/artist/onboarding")({
  head: () => ({ meta: [{ title: "Artist Account · Admiralty" }] }),
  component: ArtistOnboarding,
});

function ArtistOnboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [stageName, setStageName] = useState("");
  const [genre, setGenre] = useState("");
  const [bio, setBio] = useState("");
  const [spotify, setSpotify] = useState("");
  const [apple, setApple] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [youtube, setYoutube] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: existing, refetch } = useQuery({
    queryKey: ["my-artist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("artist_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    if (!user) return;
    if (!stageName || !proofFile) { toast.error("Stage name and proof of identity are required"); return; }
    setSubmitting(true);
    try {
      const ext = proofFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/artist-proof-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("verification-docs").upload(path, proofFile);
      if (upErr) throw upErr;

      const { error } = await supabase.from("artist_profiles").upsert({
        user_id: user.id, stage_name: stageName, genre: genre || null, bio: bio || null,
        spotify_url: spotify || null, apple_music_url: apple || null,
        soundcloud_url: soundcloud || null, youtube_url: youtube || null,
        proof_url: path, status: "pending",
      }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Submitted — we'll review within 2-5 days");
      await refetch();
      setStep(4);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background px-5 pt-20 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings/account" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Artist Account</h1>
      </header>

      <div className="px-5 pt-5">
        <div className="mb-5 flex items-start gap-3">
          <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow">
            <Mic2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Claim your music profile</h2>
            <p className="text-sm text-muted-foreground">Unlock the Music Hub on your public profile.</p>
          </div>
        </div>

        {existing && existing.status !== "rejected" ? (
          <ExistingStatus existing={existing} />
        ) : (
          <>
            {/* Stepper */}
            <div className="mb-5 flex items-center gap-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-1 flex-1 rounded-full ${step >= n ? "bg-gradient-primary" : "bg-muted"}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <Field label="Stage / Artist name" value={stageName} onChange={setStageName} placeholder="e.g. Burna Boy" />
                <Field label="Primary genre" value={genre} onChange={setGenre} placeholder="Afrobeats, R&B, Hip-Hop…" />
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Artist bio</span>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                    placeholder="Tell fans your story" className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none" />
                </label>
                <button onClick={() => stageName ? setStep(2) : toast.error("Stage name is required")}
                  className="bg-gradient-primary w-full rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow">
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Add at least one streaming profile so we can verify ownership.</p>
                <Field label="Spotify artist URL" value={spotify} onChange={setSpotify} placeholder="https://open.spotify.com/artist/..." />
                <Field label="Apple Music URL" value={apple} onChange={setApple} placeholder="https://music.apple.com/..." />
                <Field label="SoundCloud URL" value={soundcloud} onChange={setSoundcloud} placeholder="https://soundcloud.com/..." />
                <Field label="YouTube channel URL" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@..." />
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="glass flex-1 rounded-full py-3 text-sm font-semibold">Back</button>
                  <button onClick={() => setStep(3)} className="bg-gradient-primary flex-1 rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="glass rounded-2xl border-l-4 border-gold p-4">
                  <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
                    <Star className="h-4 w-4 text-gold" /> Proof of identity required
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload a screenshot from your verified artist dashboard (Spotify for Artists, Apple Music for Artists),
                    a label / management letter on letterhead, or government ID matching your real name.
                  </p>
                </div>
                <FileField label="Upload proof" file={proofFile} onChange={setProofFile} accept="image/*,application/pdf" />
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="glass flex-1 rounded-full py-3 text-sm font-semibold">Back</button>
                  <button onClick={submit} disabled={submitting}
                    className="bg-gradient-primary flex-1 rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
                    {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</span> : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExistingStatus({ existing }: { existing: any }) {
  const map = {
    pending: { Icon: Clock, tone: "text-gold", label: "Under review", desc: "We'll let you know within 2-5 business days." },
    approved: { Icon: CheckCircle2, tone: "text-accent", label: "Approved — you're an artist", desc: "Music Hub is live on your profile." },
    rejected: { Icon: XCircle, tone: "text-destructive", label: "Rejected", desc: existing.review_reason ?? "Please re-apply with more proof." },
  } as const;
  const m = (map as any)[existing.status] ?? map.pending;
  const Icon = m.Icon;
  return (
    <div className="glass space-y-4 rounded-3xl p-5">
      <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${m.tone}`} /><span className="font-display font-semibold">{m.label}</span></div>
      <div className="text-xs text-muted-foreground">{m.desc}</div>
      <div className="rounded-2xl bg-muted/40 p-3 text-xs">
        <div className="font-semibold">{existing.stage_name}</div>
        {existing.genre && <div className="text-muted-foreground">{existing.genre}</div>}
      </div>
      {existing.status === "approved" && (
        <Link to="/artist/studio" className="bg-gradient-primary block rounded-full py-3 text-center text-sm font-semibold text-primary-foreground shadow-glow">
          Open Music Studio
        </Link>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function FileField({ label, file, onChange, accept }: { label: string; file: File | null; onChange: (f: File | null) => void; accept: string }) {
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
