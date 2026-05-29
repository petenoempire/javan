import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Search, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox · Admiralty" }] }),
  component: Inbox,
});

function Inbox() {
  const { user, loading } = useAuth();

  const { data: convs = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: cs } = await supabase
        .from("conversations")
        .select("id,user_a,user_b,last_message_at")
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });
      const list = cs ?? [];
      if (list.length === 0) return [];
      const otherIds = list.map((c) => c.user_a === user!.id ? c.user_b : c.user_a);
      const { data: profs } = await supabase.from("profiles").select("id,handle,display_name,avatar_url").in("id", otherIds);
      const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const { data: lastMsgs } = await supabase
        .from("messages").select("conversation_id,body,created_at,sender_id")
        .in("conversation_id", list.map((c) => c.id)).order("created_at", { ascending: false });
      const lastByConv = new Map<string, any>();
      for (const m of lastMsgs ?? []) if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
      return list.map((c) => ({
        id: c.id,
        other: byId.get(c.user_a === user!.id ? c.user_b : c.user_a),
        last: lastByConv.get(c.id),
      }));
    },
  });

  if (loading) return <MobileShell><div className="px-5 pt-20 text-sm text-muted-foreground">Loading…</div></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold">Sign in to message</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your conversations stay private with end-to-end account protection.</p>
          <Link to="/auth" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Sign in</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Inbox</h1>
        <div className="glass mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input placeholder="Search messages" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-6">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : convs.length === 0 ? (
            <div className="glass flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
              <div className="font-display text-base font-semibold">No messages yet</div>
              <div className="text-xs text-muted-foreground">When you connect with creators, your chats will show up here.</div>
            </div>
          ) : (
            <div className="space-y-1">
              {convs.map((c) => (
                <Link key={c.id} to="/inbox/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-muted">
                  {c.other?.avatar_url
                    ? <img src={c.other.avatar_url} className="h-12 w-12 rounded-full object-cover" alt="" />
                    : <div className="bg-gradient-primary h-12 w-12 rounded-full" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate font-display font-semibold">{c.other?.display_name ?? "User"}</span>
                      {c.last && <span className="text-xs text-muted-foreground">{new Date(c.last.created_at).toLocaleDateString()}</span>}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{c.last?.body ?? "Say hi"}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
