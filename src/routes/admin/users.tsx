import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";
import { Search, BadgeCheck, Coins, Ban, ShieldOff, ShieldCheck, Clock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", q],
    queryFn: async () => {
      let query = supabase.from("profiles")
        .select("id,handle,display_name,avatar_url,is_verified,coins,earned_coins,created_at,banned,suspended_until")
        .order("created_at", { ascending: false }).limit(100);
      if (q.trim()) query = query.or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  const act = async (u: any, action: "suspend" | "unsuspend" | "ban" | "unban" | "verify" | "unverify") => {
    if (!user) return;
    const updates: {
      suspended_until?: string | null;
      banned?: boolean;
      is_verified?: boolean;
    } = {};
    if (action === "suspend") updates.suspended_until = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    if (action === "unsuspend") updates.suspended_until = null;
    if (action === "ban") updates.banned = true;
    if (action === "unban") updates.banned = false;
    if (action === "verify") updates.is_verified = true;
    if (action === "unverify") updates.is_verified = false;

    const { error: pErr } = await supabase.from("profiles").update(updates).eq("id", u.id);
    if (pErr) { toast.error(pErr.message); return; }
    await supabase.from("moderation_actions").insert({ target_user_id: u.id, admin_id: user.id, action });
    toast.success(`User ${action}ed`);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <AdminShell title="Users" subtitle="Search, audit, suspend, ban, or verify accounts.">
      <div className="glass mb-4 flex items-center gap-2 rounded-2xl px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by handle or name…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>

      <div className="glass overflow-hidden rounded-3xl">
        {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
        {data?.length === 0 && <div className="p-6 text-sm text-muted-foreground">No users found.</div>}
        {data?.map((u: any) => {
          const suspended = u.suspended_until && new Date(u.suspended_until) > new Date();
          return (
            <div key={u.id} className="border-b border-border/40 px-4 py-3 last:border-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-1 items-center gap-3">
                  <div className="bg-gradient-primary h-10 w-10 overflow-hidden rounded-full">
                    {u.avatar_url && <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 truncate text-sm font-semibold">
                      {u.display_name}
                      {u.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                      {u.banned && <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] text-destructive">Banned</span>}
                      {suspended && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] text-gold">Suspended</span>}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">@{u.handle} · joined {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs"><Coins className="h-3 w-3 text-gold" />{u.coins?.toLocaleString() ?? 0}</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {!u.is_verified
                  ? <BtnAction onClick={() => act(u, "verify")} icon={ShieldCheck}>Verify</BtnAction>
                  : <BtnAction onClick={() => act(u, "unverify")} icon={ShieldOff}>Unverify</BtnAction>}
                {!suspended
                  ? <BtnAction onClick={() => act(u, "suspend")} icon={Clock} tone="warn">Suspend 7d</BtnAction>
                  : <BtnAction onClick={() => act(u, "unsuspend")} icon={Clock}>Unsuspend</BtnAction>}
                {!u.banned
                  ? <BtnAction onClick={() => act(u, "ban")} icon={Ban} tone="danger">Ban</BtnAction>
                  : <BtnAction onClick={() => act(u, "unban")} icon={Ban}>Unban</BtnAction>}
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}

function BtnAction({ onClick, icon: Icon, children, tone }: { onClick: () => void; icon: any; children: React.ReactNode; tone?: "warn" | "danger" }) {
  const cls = tone === "danger" ? "bg-destructive text-destructive-foreground" : tone === "warn" ? "bg-gold text-background" : "glass";
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold ${cls}`}>
      <Icon className="h-3 w-3" /> {children}
    </button>
  );
}
