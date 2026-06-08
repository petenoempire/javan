import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ArrowLeft, Upload, Loader2, CheckCircle2, XCircle, Clock, BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/account/verification")({
  head: () => ({ meta: [{ title: "Verification · Javan" }] }),
  component: VerificationPage,
});

const DOC_TYPES = [
  "Government-issued ID",
  "Passport",
  "Driver's license",
  "Business registration",
  "Trademark certificate",
  "Press / media coverage (PDF)",
  "Wikipedia article (PDF)",
  "Label / agency letter",
];

function VerificationPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState<"individual" | "business">("individual");
  const [applicantType, setApplicantType] = useState("Public figure / creator");
  const [legalName, setLegalName] = useState("");
  const [publicRole, setPublicRole] = useState("");
  const [country, setCountry] = useState("");
  const [officialWebsite, setOfficialWebsite] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [pressLinks, setPressLinks] = useState("");
  const [representativeEmail, setRepresentativeEmail] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: latest, refetch } = useQuery({
    queryKey: ["my-verification", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("verifications").select("*").eq("user_id", user!.id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    if (!user) return;
    if (!legalName || !country || !publicRole || !officialWebsite || !socialLinks || !pressLinks || !docFile || !notes) {
      toast.error("Please complete identity, public role, official links, press proof, document, and notability details");
      return;
    }
    setSubmitting(true);
    try {
      const upload = async (f: File, label: string) => {
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${label}.${ext}`;
        const { error } = await supabase.storage.from("verification-docs").upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        return path;
      };
      const docPath = await upload(docFile, "doc");
      const selfiePath = selfieFile ? await upload(selfieFile, "selfie") : null;
      const reviewNotes = [
        `Applicant type: ${applicantType}`,
        `Public role/category: ${publicRole}`,
        `Official website: ${officialWebsite}`,
        `Official social profiles: ${socialLinks}`,
        `Press / public proof links: ${pressLinks}`,
        representativeEmail ? `Representative email: ${representativeEmail}` : null,
        `Statement: ${notes}`,
      ].filter(Boolean).join("\n\n");
      const { error: insErr } = await supabase.from("verifications").insert({
        user_id: user.id, kind, legal_name: legalName, country,
        document_type: docType, document_url: docPath, selfie_url: selfiePath,
        notes: reviewNotes,
      });
      if (insErr) throw insErr;
      toast.success("Submitted for review");
      await refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background px-5 pt-20 text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings/account" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Verification</h1>
      </header>

      <div className="px-5 pt-5">
        <div className="mb-5 flex items-start gap-3">
          <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Verified badge</h2>
            <p className="text-sm text-muted-foreground">For notable public figures, brands, and entities.</p>
          </div>
        </div>

        {/* Eligibility notice */}
        <div className="glass mb-5 rounded-2xl border-l-4 border-gold p-4">
          <div className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
            <Star className="h-4 w-4 text-gold" /> Notability is mandatory
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            The verification badge is <span className="font-semibold text-foreground">not an open feature</span>. It is
            strictly reserved for public figures, celebrities, established brands, and notable entities.
            Submissions <span className="font-semibold text-foreground">must include proof of notable public status</span> —
            press coverage, Wikipedia article, label/agency letter, or equivalent — or they will be rejected.
          </p>
        </div>

        {profile?.is_verified && (
          <div className="glass mb-5 rounded-2xl p-4">
            <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 fill-accent text-background" /><span className="font-display font-semibold">You are verified</span></div>
          </div>
        )}

        {latest && <StatusCard latest={latest} />}

        {(!latest || latest.status === "rejected") && !profile?.is_verified && (
          <div className="space-y-3">
            <div className="glass rounded-2xl p-1">
              <div className="grid grid-cols-2 gap-1">
                {(["individual", "business"] as const).map((k) => (
                  <button key={k} onClick={() => setKind(k)}
                    className={`rounded-xl py-2 text-xs font-semibold capitalize ${kind === k ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Legal full name / brand name" value={legalName} onChange={setLegalName} placeholder="As it appears on the document" />
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Applicant category</span>
              <select value={applicantType} onChange={(e) => setApplicantType(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none">
                {[
                  "Public figure / creator", "Celebrity / entertainer", "Politician / government official",
                  "Journalist / media personality", "Athlete", "Registered brand / company", "Music artist / label",
                ].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <Field label="Public role or known name" value={publicRole} onChange={setPublicRole} placeholder="e.g. Senator, actor, musician, official brand" />
            <Field label="Country of residence" value={country} onChange={setCountry} placeholder="e.g. Nigeria, United States" />
            <Field label="Official website" value={officialWebsite} onChange={setOfficialWebsite} placeholder="https://official-site.com" />
            <Field label="Official social profiles" value={socialLinks} onChange={setSocialLinks} placeholder="Instagram, X, YouTube, Facebook links" />
            <Field label="Press / public proof links" value={pressLinks} onChange={setPressLinks} placeholder="News articles, Wikipedia, IMDb, government page, brand registry" />
            <Field label="Representative email (optional)" value={representativeEmail} onChange={setRepresentativeEmail} placeholder="manager@agency.com" />

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Proof / document type</span>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none">
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <FileField label="Upload primary document" file={docFile} onChange={setDocFile} accept="image/*,application/pdf" />
            {kind === "individual" && (
              <FileField label="Selfie holding document (optional)" file={selfieFile} onChange={setSelfieFile} accept="image/*" />
            )}

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Proof of notability (required)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                placeholder="Link press coverage, Wikipedia, label/agency letters, follower counts on other major platforms, etc."
                className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none" />
            </label>

            <button onClick={submit} disabled={submitting}
              className="bg-gradient-primary w-full rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</span> : "Submit for review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ latest }: { latest: any }) {
  const map = {
    pending: { icon: Clock, label: "Under review", tone: "text-gold", desc: "Reviewed within 1–3 business days." },
    approved: { icon: CheckCircle2, label: "Approved", tone: "text-accent", desc: "Your badge has been applied." },
    rejected: { icon: XCircle, label: "Rejected", tone: "text-destructive", desc: latest.review_reason ?? "Please review and try again." },
  } as const;
  const m = (map as any)[latest.status];
  const Icon = m.icon;
  return (
    <div className="glass mb-5 rounded-2xl p-4">
      <div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${m.tone}`} /><span className="font-display font-semibold">{m.label}</span></div>
      <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
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
