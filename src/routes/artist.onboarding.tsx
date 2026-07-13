import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mic2, Upload, Loader2, CheckCircle2, XCircle, Clock, Star, Disc, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/artist/onboarding")({
  head: () => ({ meta: [{ title: "Artist Verification · Javan" }] }),
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
    if (!stageName || !proofFile) { toast.error("Stage name and profile proof parameters are mandatory."); return; }
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
      toast.success("Identity payload transmitted safely. Processing timeline: 2-5 cycles.");
      await refetch();
      setStep(4);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black px-5 pt-20 text-xs font-mono text-neutral-500">INITIALIZING_CREATOR_CREDENTIALS…</div>;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-black text-white pb-24 selection:bg-rose-500/30 select-none">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-neutral-950/80 px-4 py-3.5 backdrop-blur-md">
        <Link to="/settings/account" className="text-neutral-400 hover:text-white transition-colors p-1"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="font-display text-xs font-black uppercase tracking-widest text-neutral-400">Identity Ledger Form</h1>
      </header>

      <div className="px-4 pt-5">
        <div className="mb-6 flex items-start gap-3.5 bg-neutral-900/40 border border-white/5 rounded-2xl p-4">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-rose-500 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-glow">
            <Mic2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="font-display text-sm font-black uppercase tracking-wider text-white">Claim Artist Instance</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-normal">Authenticate catalog governance nodes to run localized audio sync tracks natively.</p>
          </div>
        </div>

        {existing && existing.status !== "rejected" ? (
          <ExistingStatus existing={existing} />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-1.5 px-0.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= n ? "bg-rose-500" : "bg-neutral-900"}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <Field label="Stage / Artist Designation" value={stageName} onChange={setStageName} placeholder="e.g. Peteno" />
                <Field label="Primary Sonic Genre" value={genre} onChange={setGenre} placeholder="Afrobeats, Rap, Hip-Hop…" />
                <label className="block">
                  <span className="mb-1.5 block text-[9px] font-mono font-black uppercase tracking-widest text-neutral-500">Artist Profile Manifesto</span>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                    placeholder="Briefly index your creative narrative vector..." className="w-full resize-none rounded-xl border border-white/5 bg-neutral-900/50 px-4 py-3 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-rose-500 transition-shadow placeholder:text-neutral-600" />
                </label>
                <button 
                  onClick={() => stageName ? setStep(2) : toast.error("Stage naming designation parameter mandatory.")}
                  className="bg-gradient-to-r from-fuchsia-500 to-rose-500 w-full rounded-xl py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-glow active:scale-98 transition-transform duration-150"
                >
                  Proceed to Metadata Registry
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="p-3 bg-neutral-900/20 border border-white/5 rounded-xl text-[10px] font-medium text-neutral-400 leading-normal">
                  Link at least one streaming handle node infrastructure to assist system review validators.
                </div>
                <Field label="Spotify Artist URL" value={spotify} onChange={setSpotify} placeholder="https://open.spotify.com/artist/..." />
                <Field label="Apple Music Creator URL" value={apple} onChange={setApple} placeholder="https://music.apple.com/artist/..." />
                <Field label="SoundCloud Node link" value={soundcloud} onChange={setSoundcloud} placeholder="https://soundcloud.com/..." />
                <Field label="YouTube Core Channel Address" value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@..." />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setStep(1)} className="bg-neutral-900 border border-white/5 text-neutral-400 text-[10px] font-black uppercase tracking-wider flex-1 rounded-xl py-3 active:scale-95 transition-transform">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="bg-gradient-to-r from-fuchsia-500 to-rose-500 text-[10px] font-black uppercase tracking-widest text-white shadow-glow flex-1 rounded-xl py-3 active:scale-95 transition-transform">
                    Continue Execution
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="border border-amber-500/10 bg-amber-500/5 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400 text-transparent" /> Governance Proof Mandatory
                  </div>
                  <p className="text-[11px] text-neutral-400 font-medium leading-normal">
                    Provide dashboard snapshots (Spotify/Apple for Artists), a distributor delivery confirmation sheet (Amuse, Ditto), or corporate legal letterheads confirming ownership.
                  </p>
                </div>
                
                <FileField label="Upload Authentication Token Bundle" file={proofFile} onChange={setProofFile} accept="image/*,application/pdf" />
                
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setStep(2)} className="bg-neutral-900 border border-white/5 text-neutral-400 text-[10px] font-black uppercase tracking-wider flex-1 rounded-xl py-3 active:scale-95 transition-transform">
                    Back
                  </button>
                  <button onClick={submit} disabled={submitting}
                    className="bg-gradient-to-r from-fuchsia-500 to-rose-500 text-[10px] font-black uppercase tracking-widest text-white shadow-glow flex-1 rounded-xl py-3 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {submitting ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> COMMITTING_PAYLOAD…</span> : "Transmit Ledger Application"}
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
    pending: { Icon: Clock, tone: "text-amber-400 bg-amber-500/5 border-amber-500/10", label: "PENDING_VALIDATION_AUDIT", desc: "Identity payload undergoes routing check parameters. Standard windowing: 48-72 hours." },
    approved: { Icon: ShieldCheck, tone: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10", label: "VERIFIED_ARTIST_NODE", desc: "Governance clearance granted. Production Music Hub module is live." },
    rejected: { Icon: XCircle, tone: "text-rose-400 bg-rose-500/5 border-rose-500/10", label: "VALIDATION_REJECTED", desc: existing.review_reason ?? "Re-submit application with tighter dashboard snapshots." },
  } as const;
  
  const m = map[existing.status as keyof typeof map] ?? map.pending;
  const Icon = m.Icon;
  
  return (
    <div className={`border rounded-2xl p-4 space-y-3.5 ${m.tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-mono text-xs font-black tracking-wider uppercase">{m.label}</span>
      </div>
      <div className="text-[11px] font-medium text-neutral-400 leading-normal">{m.desc}</div>
      
      <div className="rounded-xl bg-neutral-950 border border-white/5 p-3 font-mono">
        <div className="text-xs font-black text-white">{existing.stage_name}</div>
        {existing.genre && <div className="text-[9px] font-bold uppercase text-neutral-500 mt-0.5 tracking-wider">{existing.genre}</div>}
      </div>
      
      {existing.status === "approved" && (
        <Link to="/artist/studio" className="bg-gradient-to-r from-fuchsia-500 to-rose-500 flex items-center justify-center gap-1 rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-white shadow-glow active:scale-95 transition-transform">
          Enter Production Studio Core <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[9px] font-mono font-black uppercase tracking-widest text-neutral-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-white/5 bg-neutral-900/50 px-4 py-2.5 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-rose-500 transition-shadow placeholder:text-neutral-600" />
    </label>
  );
}

function FileField({ label, file, onChange, accept }: { label: string; file: File | null; onChange: (f: File | null) => void; accept: string }) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-[9px] font-mono font-black uppercase tracking-widest text-neutral-500">{label}</span>
      <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-white/10 bg-neutral-900/30 px-4 py-6 group hover:border-white/20 transition-colors">
        <Upload className="h-5 w-5 text-neutral-500 group-hover:text-neutral-400 transition-colors mb-2" />
        <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="hidden" />
        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Select File Spec</span>
        <span className="text-[9px] font-mono font-bold text-neutral-600 uppercase tracking-tight mt-0.5">PDF or Image up to 10MB</span>
      </div>
      {file && (
        <div className="mt-2 text-center rounded-lg bg-neutral-900/60 border border-white/5 px-3 py-1.5 truncate text-[10px] font-mono font-bold text-rose-400">
          🔗 {file.name}
        </div>
      )}
    </label>
  );
}
