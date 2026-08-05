import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { CheckCircle2, XCircle, FileText, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/verifications")({
  component: AdminVerifications,
});

function AdminVerifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [reasonOpen, setReasonOpen] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["admin-verifications", tab],
    queryFn: async () => {
      const { data } = await supabase.from("verifications").select("*").eq("status", tab).order("created_at", { ascending: false });
      const ids = Array.from(new Set((data ?? []).map((d) => d.user_id)));
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id,handle,display_name,avatar_url").in("id", ids) : { data: [] as any[] };
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (data ?? []).map((r) => ({ ...r, profile: byId.get(r.user_id) }));
    },
  });

  const signedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("verification-docs").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const approve = async (v: any) => {
    if (!user) return;
    const updates = [
      supabase.from("verifications").update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", v.id),
      supabase.from("profiles").update({ is_verified: true }).eq("id", v.user_id),
      supabase.from("moderation_actions").insert({ target_user_id: v.user_id, admin_id: user.id, action: "verify", reason: "verification approved" }),
    ];
    const res = await Promise.all(updates);
    const err = res.find((r) => (r as any).error);
    if (err) { toast.error((err as any).error.message); return; }
    toast.success("Verified");
    qc.invalidateQueries({ queryKey: ["admin-verifications"] });
  };

  const reject = async (v: any) => {
    if (!user) return;
    const { error } = await supabase.from("verifications").update({
      status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString(), review_reason: reason || "Documents could not be verified.",
    }).eq("id", v.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rejected");
    setReasonOpen(null); setReason("");
    qc.invalidateQueries({ queryKey: ["admin-verifications"] });
  };

  return (
    <AdminShell title="Verifications" subtitle="Manually review identity and brand verification requests.">
      <div className="glass mb-4 inline-flex rounded-full p-1">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div>
        : items.length === 0 ? (
          <div className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
            <ShieldCheck className="h-7 w-7 text-muted-foreground" />
            <div className="font-display font-semibold">No {tab} requests</div>
            <div className="text-xs text-muted-foreground">Submissions will appear here as users apply.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((v: any) => (
              <div key={v.id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {v.profile?.avatar_url ? <img src={v.profile.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                      : <div className="bg-gradient-primary h-10 w-10 rounded-full" />}
                    <div>
                      <div className="text-sm font-semibold">{v.legal_name} <span className="text-xs text-muted-foreground">· @{v.profile?.handle}</span></div>
                      <div className="text-xs text-muted-foreground">{v.kind} · {v.country} · {v.document_type}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                </div>
                {v.notes && <div className="mt-2 text-xs text-muted-foreground">"{v.notes}"</div>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => signedUrl(v.document_url)} className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs">
                    <FileText className="h-3.5 w-3.5" /> View document
                  </button>
                  {v.selfie_url && (
                    <button onClick={() => signedUrl(v.selfie_url)} className="glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" /> View selfie
                    </button>
                  )}
                </div>
                {tab === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => approve(v)} className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-background">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => setReasonOpen(v.id)} className="inline-flex items-center gap-1 rounded-full bg-destructive px-4 py-1.5 text-xs font-semibold text-destructive-foreground">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
                {reasonOpen === v.id && (
                  <div className="mt-3 space-y-2">
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason shown to user"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs outline-none" />
                    <div className="flex gap-2">
                      <button onClick={() => reject(v)} className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground">Confirm reject</button>
                      <button onClick={() => { setReasonOpen(null); setReason(""); }} className="glass rounded-full px-3 py-1.5 text-xs">Cancel</button>
                    </div>
                  </div>
                )}
                {v.review_reason && tab === "rejected" && (
                  <div className="mt-2 text-xs text-destructive">Reason: {v.review_reason}</div>
                )}
              </div>
            ))}
          </div>
        )
      }
    </AdminShell>
  );
}
