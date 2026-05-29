import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ArrowLeft, Upload, Loader2, CheckCircle2, XCircle, Clock, BadgeCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "Get verified · Admiralty" }] }),
  component: VerifyPage,
});

const DOC_TYPES = [
  "Government-issued ID",
  "Passport",
  "NIN (Nigeria)",
  "SSN card (US)",
  "Driver's license",
  "Business registration",
  "Trademark certificate",
  "Other country-specific ID",
];

function VerifyPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [kind, setKind] = useState<"individual" | "business">("individual");
  const [legalName, setLegalName] = useState("");
  const [country, setCountry] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: latest, refetch } = useQuery({
    queryKey: ["my-verification", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("verifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    if (!user) return;
    if (!legalName || !country || !docFile) { toast.error("Please fill all required fields"); return; }
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
      const { error: insErr } = await supabase.from("verifications").insert({
        user_id: user.id,
        kind,
        legal_name: legalName,
        country,
        document_type: docType,
        document_url: docPath,
        selfie_url: selfiePath,
        notes: notes || null,
      });
      if (insErr) throw insErr;
      toast.success("Verification submitted for review");
      await refetch();
    } catch (e: any) {
      toast.error(e.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return <MobileShell><div className="px-5 pt-20 text-sm text-muted-foreground">Loading…</div></MobileShell>;

  if (profile?.is_verified) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <BadgeCheck className="mb-3 h-12 w-12 fill-accent text-background" />
          <h2 className="font-display text-2xl font-bold">You're verified</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your account has a verified badge.</p>
          <Link to="/profile" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Back to profile</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-5 pt-20 pb-32">
        <Link to="/profile" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3 w-3" /> Profile</Link>
        <div className="mb-6 flex items-start gap-3">
          <div className="bg-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-glow">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Get verified</h1>
            <p className="text-sm text-muted-foreground">Submit your identity or brand documents. An admin will review manually.</p>
          </div>
        </div>

        {latest && (
          <StatusCard latest={latest} />
        )}

        {(!latest || latest.status === "rejected") && (
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
            <Field label="Country of residence" value={country} onChange={setCountry} placeholder="e.g. Nigeria, United States" />

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Document type</span>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none">
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <FileField label="Upload document (front)" file={docFile} onChange={setDocFile} accept="image/*,application/pdf" />
            {kind === "individual" && (
              <FileField label="Upload selfie holding document (optional)" file={selfieFile} onChange={setSelfieFile} accept="image/*" />
            )}

            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Anything you'd like the reviewer to know"
                className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none" />
            </label>

            <div className="rounded-2xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
              Documents are stored securely and only visible to verification admins. Submitting fraudulent documents will result in a permanent ban.
            </div>

            <button onClick={submit} disabled={submitting}
              className="bg-gradient-primary w-full rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</span> : "Submit for review"}
            </button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function StatusCard({ latest }: { latest: any }) {
  const map = {
    pending:   { icon: Clock,        label: "Under review",   tone: "text-gold",        desc: "Our team will review within 1–3 business days." },
    approved:  { icon: CheckCircle2, label: "Approved",       tone: "text-accent",      desc: "Your badge has been applied." },
    rejected:  { icon: XCircle,      label: "Rejected",       tone: "text-destructive", desc: latest.review_reason ?? "Please review the requirements and try again." },
  } as const;
  const m = (map as any)[latest.status];
  const Icon = m.icon;
  return (
    <div className="glass mb-5 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${m.tone}`} />
        <span className="font-display font-semibold">{m.label}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{m.desc}</div>
      <div className="mt-2 text-[11px] text-muted-foreground">Submitted {new Date(latest.created_at).toLocaleString()}</div>
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
