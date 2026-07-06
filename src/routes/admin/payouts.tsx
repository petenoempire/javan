import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowDownToLine, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payouts")({
  component: AdminPayouts,
});

function AdminPayouts() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payout_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      const list = data ?? [];
      const uids = Array.from(new Set(list.map((r: any) => r.user_id)));
      if (uids.length) {
        const { data: profs } = await (supabase as any).rpc("admin_profiles_by_ids", { _ids: uids });
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        return list.map((r: any) => ({ ...r, profile: map.get(r.user_id) }));
      }
      return list;
    },
  });

  const update = async (id: string, status: string, note?: string) => {
    if (!user) return;
    const { error } = await supabase.from("payout_requests").update({
      status,
      admin_notes: note ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
  };

  const pending = rows.filter((r: any) => r.status === "pending");
  const reviewed = rows.filter((r: any) => r.status !== "pending");

  return (
    <AdminShell title="Payouts" subtitle="Review and process creator payout requests.">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pending" value={pending.length} tone="primary" />
        <Stat label="Approved" value={rows.filter((r: any) => r.status === "approved").length} tone="accent" />
        <Stat label="Paid" value={rows.filter((r: any) => r.status === "paid").length} tone="gold" />
      </div>

      <div className="mt-6">
        <div className="font-display mb-2 text-sm font-semibold">Awaiting review · {pending.length}</div>
        {pending.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">No pending payouts.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((r: any) => <PayoutRow key={r.id} r={r} onAction={update} />)}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="font-display mb-2 text-sm font-semibold">History</div>
        {reviewed.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center text-xs text-muted-foreground">No history yet.</div>
        ) : (
          <div className="space-y-2">
            {reviewed.map((r: any) => <PayoutRow key={r.id} r={r} onAction={update} compact />)}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  const cls = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-gold";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display mt-1 text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}

function PayoutRow({ r, onAction, compact }: { r: any; onAction: (id: string, status: string, note?: string) => void; compact?: boolean }) {
  const statusIcon = r.status === "paid" || r.status === "approved" ? CheckCircle2 : r.status === "rejected" ? XCircle : Clock;
  const Icon = statusIcon;
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex flex-wrap items-center gap-3">
        {r.profile?.avatar_url
          ? <img src={r.profile.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
          : <div className="bg-gradient-primary h-10 w-10 rounded-full" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            @{r.profile?.handle ?? "unknown"}
            {r.profile?.is_verified && <span className="text-[10px] text-accent">✓ verified</span>}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {new Date(r.created_at).toLocaleString()} · {r.payout_method.toUpperCase()}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-lg font-bold">${(r.usd_cents / 100).toFixed(2)}</div>
          <div className="text-[11px] text-muted-foreground">{r.coins.toLocaleString()} coins</div>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${r.status === "pending" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Icon className="h-3 w-3" /> {r.status}
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-muted/40 p-3 text-xs">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Destination</div>
        <div className="mt-0.5 whitespace-pre-wrap font-mono">{r.payout_details}</div>
      </div>

      {!compact && r.status === "pending" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => onAction(r.id, "approved")} className="bg-gradient-primary rounded-xl py-2 text-xs font-bold text-primary-foreground shadow-glow">Approve</button>
          <button onClick={() => onAction(r.id, "paid")} className="bg-gradient-gold rounded-xl py-2 text-xs font-bold text-background shadow-glow">Mark paid</button>
          <button onClick={() => onAction(r.id, "rejected", "Declined by admin")} className="glass rounded-xl py-2 text-xs font-bold text-destructive">Reject</button>
        </div>
      )}

      {r.admin_notes && <div className="mt-2 text-[11px] text-muted-foreground">Note: {r.admin_notes}</div>}
    </div>
  );
}
