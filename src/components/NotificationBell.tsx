import { useEffect, useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Gift, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Notif = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: string;
  body: string | null;
  read: boolean;
  created_at: string;
  actor?: { handle: string; display_name: string; avatar_url: string | null } | null;
};

const iconFor = (kind: string) => {
  switch (kind) {
    case "follow": return UserPlus;
    case "like": return Heart;
    case "comment":
    case "message": return MessageCircle;
    case "gift": return Gift;
    case "payout":
    case "topup": return Wallet;
    default: return Bell;
  }
};

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      const list = (data ?? []) as Notif[];
      const actorIds = Array.from(new Set(list.map((n) => n.actor_id).filter(Boolean) as string[]));
      if (actorIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,handle,display_name,avatar_url")
          .in("id", actorIds);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        for (const n of list) if (n.actor_id) n.actor = map.get(n.actor_id) ?? null;
      }
      return list;
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) markAllRead(); }}>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="glass relative flex h-10 w-10 items-center justify-center rounded-full text-foreground shadow-elegant transition-transform active:scale-90"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="bg-gradient-primary absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-primary-foreground shadow-glow">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-display text-sm font-semibold">Notifications</div>
          <div className="text-[11px] text-muted-foreground">{items.length} recent</div>
        </div>
        <div className="max-h-[60dvh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">You're all caught up.</div>
          ) : (
            items.map((n) => {
              const Icon = iconFor(n.kind);
              const when = new Date(n.created_at);
              return (
                <Link
                  key={n.id}
                  to={n.actor?.handle ? "/u/$handle" : "/"}
                  params={n.actor?.handle ? { handle: n.actor.handle } : undefined as any}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 border-b border-border/40 px-4 py-3 last:border-0 hover:bg-muted/50"
                >
                  <div className="relative">
                    {n.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} className="h-9 w-9 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="bg-gradient-primary h-9 w-9 rounded-full" />
                    )}
                    <div className="bg-background absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border">
                      <Icon className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      {n.actor?.display_name && <span className="font-semibold">@{n.actor.handle} </span>}
                      <span className="text-muted-foreground">{n.body ?? n.kind}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{when.toLocaleString()}</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
