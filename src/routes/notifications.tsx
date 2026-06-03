import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, Gift, Wallet } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Boogle" }] }),
  component: NotificationsPage,
});

type Notif = {
  id: string; user_id: string; actor_id: string | null;
  kind: string; body: string | null; read: boolean; created_at: string;
  actor?: { handle: string; display_name: string; avatar_url: string | null } | null;
};

const iconFor = (k: string) => k === "follow" ? UserPlus : k === "like" ? Heart
  : k === "comment" || k === "message" ? MessageCircle : k === "gift" ? Gift
  : k === "payout" || k === "topup" ? Wallet : Bell;

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*")
        .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(60);
      const list = (data ?? []) as Notif[];
      const ids = Array.from(new Set(list.map(n => n.actor_id).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("id,handle,display_name,avatar_url").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        for (const n of list) if (n.actor_id) n.actor = map.get(n.actor_id) ?? null;
      }
      return list;
    },
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("notifications").update({ read: true })
      .eq("user_id", user.id).eq("read", false).then(() => {
        qc.invalidateQueries({ queryKey: ["notifications", user.id] });
      });
  }, [user, qc]);

  if (!user) {
    return (
      <MobileShell>
        <div className="px-6 pt-24 text-center">
          <h1 className="font-display text-2xl font-bold">Sign in</h1>
          <Link to="/auth" className="bg-gradient-primary mt-4 inline-block rounded-full px-6 py-2 text-sm font-semibold text-primary-foreground">Sign in</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Notifications</h1>
      </header>

      <div className="px-3 py-3">
        {items.length === 0 ? (
          <div className="glass mt-10 rounded-3xl p-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">You're all caught up</div>
            <div className="mt-1 text-xs text-muted-foreground">New activity will appear here.</div>
          </div>
        ) : (
          <ul className="glass divide-y divide-border/40 overflow-hidden rounded-2xl">
            {items.map((n) => {
              const Icon = iconFor(n.kind);
              return (
                <li key={n.id}>
                  <Link
                    to={n.actor?.handle ? "/u/$handle" : "/"}
                    params={n.actor?.handle ? { handle: n.actor.handle } : undefined as any}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40"
                  >
                    <div className="relative">
                      {n.actor?.avatar_url
                        ? <img src={n.actor.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                        : <div className="bg-gradient-primary h-10 w-10 rounded-full" />}
                      <div className="bg-background absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border">
                        <Icon className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        {n.actor?.handle && <span className="font-semibold">@{n.actor.handle} </span>}
                        <span className="text-muted-foreground">{n.body ?? n.kind}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
