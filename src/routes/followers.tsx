import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, UserPlus } from "lucide-react";

export const Route = createFileRoute("/followers")({
  head: () => ({ meta: [{ title: "Followers · Javan" }] }),
  component: FollowersPage,
});

function FollowersPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const { data = [] } = useQuery({
    queryKey: ["my-followers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase.from("follows")
        .select("follower_id").eq("following_id", user!.id);
      const ids = (rows ?? []).map(r => r.follower_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles")
        .select("id,handle,display_name,avatar_url,bio").in("id", ids);
      return profs ?? [];
    },
  });

  return (
    <MobileShell>
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => nav({ to: "/profile" })} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="font-display text-lg font-bold">Followers</h1>
      </header>
      <div className="px-3 py-3">
        {data.length === 0 ? (
          <div className="glass mt-10 rounded-3xl p-10 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">No followers yet</div>
            <div className="mt-1 text-xs text-muted-foreground">Share your profile to grow your community.</div>
          </div>
        ) : (
          <ul className="glass divide-y divide-border/40 overflow-hidden rounded-2xl">
            {data.map((p: any) => (
              <li key={p.id}>
                <Link to="/u/$handle" params={{ handle: p.handle }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="h-11 w-11 rounded-full object-cover" alt="" />
                    : <div className="bg-gradient-primary h-11 w-11 rounded-full" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">@{p.handle}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.display_name}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}
