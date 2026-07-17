import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, BadgeCheck, Upload, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [{ title: "Get Verified · Javan" }] }),
  component: VerifyPage,
});

const CATEGORIES = [
  { value: "public_figure", label: "Public Figure" },
  { value: "artist", label: "Artist / Musician" },
  { value: "celebrity", label: "Celebrity" },
  { value: "politician", label: "Politician / Government Official" },
  { value: "business", label: "Business / Brand" },
  { value: "other", label: "Other" },
];

function VerifyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState("public_figure");
  const [fullName, setFullName] = useState("");
  const [reason, setReason] = useState("");
  const [externalLinks, setExternalLinks] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: existing, refetch } = useQuery({
    queryKey: ["my-verification-request", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const submit = async () => {
    if (!user) return;
    if (!fullName.trim() || !reason.trim()) {
      toast.error("Full name and reason are required.");
      return;
    }
    if (!proofFile) {
      toast.error("Please upload proof of identity (government ID, official press mention, etc).");
      return;
    }

    setSubmitting(true);
    try {
      const ext = proofFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/verify-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("verification-docs").upload(path, proofFile);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from("verification_requests").upsert(
        {
          user_id: user.id,
          category,
          full_name: fullName.trim(),
          reason: reason.trim(),
          external_links: externalLinks.trim() || null,
          proof_path: path,
          status: "pending",
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;

      toast.success("Verification request submitted!");
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <MobileShell>
        <div className="px-5 pt-20 text-sm text-white/50">Loading...</div>
      </MobileShell>
    );
  }

  if (existing && existing.status !== "rejected") {
    return (
      <MobileShell>
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/profile" className="text-white/50 p-1">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-lg font-black">Verification Request</h1>
          </div>
          <StatusCard request={existing} />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="text-white/50 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg font-black">Get Verified</h1>
        </div>

        {existing?.status === "rejected" && (
          <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300">
            Your previous request wasn't approved{existing.review_reason ? `: ${existing.review_reason}` : "."} You can submit a new one below.
          </div>
        )}

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="bg-gradient-to-tr from-blue-500 to-cyan-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <BadgeCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-display text-sm font-black">Request the verified badge</h2>
            <p className="text-xs text-white/50 mt-1 leading-relaxed">
              For notable public figures, artists, celebrities, politicians, and businesses.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-neutral-900">
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <Field label="Full Legal / Public Name *" value={fullName} onChange={setFullName} placeholder="e.g. Wizkid" />

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">Why should you be verified? *</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe your notability — press coverage, official role, public recognition..."
              className="w-full resize-none rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
            />
          </label>

          <Field
            label="Links (news articles, Wikipedia, official sites)"
            value={externalLinks}
            onChange={setExternalLinks}
            placeholder="https://..."
          />

          <FileField file={proofFile} onChange={setProofFile} />

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}

function StatusCard({ request }: { request: any }) {
  const config = {
    pending: {
      Icon: Clock,
      tone: "text-amber-400 bg-amber-500/5 border-amber-500/20",
      label: "Under Review",
      desc: "We're reviewing your request. This can take a few days.",
    },
    approved: {
      Icon: CheckCircle2,
      tone: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
      label: "Approved",
      desc: "Congratulations — your account is now verified!",
    },
  } as const;

  const c = config[request.status as keyof typeof config] ?? config.pending;
  const Icon = c.Icon;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${c.tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-black">{c.label}</span>
      </div>
      <p className="text-xs text-white/60 leading-relaxed">{c.desc}</p>
      <div className="rounded-xl bg-black/30 border border-white/5 p-3">
        <p className="text-sm font-bold text-white">{request.full_name}</p>
        <p className="text-xs text-white/40 mt-0.5 capitalize">{request.category.replace("_", " ")}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-neutral-900/50 px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
      />
    </label>
  );
}

function FileField({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-white/50">
        Proof of identity *
      </span>
      <p className="mb-2 text-[10px] text-white/40">Government ID, official press mention, or Wikipedia page.</p>
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-neutral-900/30 px-4 py-6 hover:border-white/20 transition-colors">
        <Upload className="h-5 w-5 text-white/40 mb-2" />
        <input type="file" accept="image/*,application/pdf" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="hidden" />
        <span className="text-xs font-bold text-white/60">Choose file</span>
      </div>
      {file && (
        <div className="mt-2 rounded-lg bg-black/30 border border-white/5 px-3 py-1.5 truncate text-xs text-blue-400">
          {file.name}
        </div>
      )}
    </label>
  );
}
