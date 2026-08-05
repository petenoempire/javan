import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Users, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/following")({
  head: () => ({
    meta: [
      { title: "Following · Javan" },
      { name: "description", content: "See the creators you follow on Javan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Following · Javan" },
      { property: "og:description", content: "See the creators you follow on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/following" },
      { name: "twitter:title", content: "Following · Javan" },
      { name: "twitter:description", content: "See the creators you follow on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/following" }],
  }),
  component: FollowingPage,
});

function FollowingPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  const { data = [] } = useQuery({
    queryKey: ["my-following", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase.from("follows")
        .select("following_id").eq("follower_id", user!.id);
      const ids = (rows ?? []).map(r => r.following_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles")
        .select("id,handle,display_name,avatar_url,bio").in("id", ids);
      return profs ?? [];
    },
  });

  return (
    <>
    <DesktopLayout>
      <div className="max-w-4xl mx-auto py-10">
        <h2 className="text-4xl font-black text-chrome mb-8 tracking-tight">Following</h2>
        {data.length === 0 ? (
          <div className="glass p-20 rounded-[2.5rem] border border-white/5 text-center">
            <Users className="mx-auto h-12 w-12 text-white/10 mb-6" />
            <h2 className="text-xl font-bold mb-2">Not following anyone yet</h2>
            <p className="text-white/40 mb-8">Start following creators to see their latest content here.</p>
            <Link to="/discover">
              <Button className="bg-gradient-primary rounded-xl px-8 py-6">Discover Creators</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((p: any) => (
              <Link key={p.id} to="/u/$handle" params={{ handle: p.handle }} className="glass p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 shadow-lg"></div>
                  <div>
                    <p className="font-bold text-white">@{p.handle}</p>
                    <p className="text-xs text-white/40">{p.display_name}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DesktopLayout>
    <MobileShell>
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <button onClick={() => nav({ to: "/profile" })} aria-label="Back to profile" className="p-1"><ArrowLeft className="h-5 w-5" /></button>
        <h2 className="font-display text-lg font-bold text-chrome">Following</h2>
      </header>
      <div className="px-3 py-3">
        {data.length === 0 ? (
          <div className="glass mt-10 rounded-3xl p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">Not following anyone yet</div>
            <Link to="/discover" className="bg-gradient-primary mt-4 inline-block rounded-full px-5 py-2 text-xs font-semibold text-primary-foreground">Discover creators</Link>
          </div>
        ) : (
          <ul className="glass divide-y divide-border/40 overflow-hidden rounded-2xl">
            {data.map((p: any) => (
              <li key={p.id}>
                <Link to="/u/$handle" params={{ handle: p.handle }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="h-11 w-11 rounded-full object-cover" alt={`${p.display_name}'s avatar`} />
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
    </>
  );
}
