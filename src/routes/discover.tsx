import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, Hash, Sparkles } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover · Boogle" }] }),
  component: Discover,
});

function Discover() {
  const [q, setQ] = useState("");

  const { data: videos = [] } = useQuery({
    queryKey: ["discover-trending", q],
    queryFn: async () => {
      let query = supabase
        .from("videos")
        .select("id,thumbnail_url,caption,user_id,tags,profiles!videos_user_id_fkey(handle)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(30);
      if (q.trim()) query = query.ilike("caption", `%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  const { data: creators = [] } = useQuery({
    queryKey: ["discover-creators", q],
    enabled: q.trim().length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles").select("id,handle,display_name,avatar_url,is_verified")
        .or(`handle.ilike.%${q}%,display_name.ilike.%${q}%`).limit(10);
      return data ?? [];
    },
  });

  const tags = useMemo(() => {
    const seen = new Map<string, number>();
    for (const v of videos as any[]) for (const t of v.tags ?? []) {
      const k = t.toLowerCase();
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    return Array.from(seen.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [videos]);

  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Discover</h1>
        <div className="glass mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators, captions, tags…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        {q.trim() && creators.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 font-display text-lg font-semibold">Creators</h2>
            <div className="space-y-1">
              {creators.map((c: any) => (
                <div key={c.id} className="glass flex items-center gap-3 rounded-2xl p-3">
                  {c.avatar_url ? <img src={c.avatar_url} className="h-10 w-10 rounded-full object-cover" alt="" />
                    : <div className="bg-gradient-primary h-10 w-10 rounded-full" />}
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{c.display_name}</div>
                    <div className="text-xs text-muted-foreground">@{c.handle}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tags.length > 0 && (
          <section className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Trending tags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(([t, n]) => (
                <button key={t} onClick={() => setQ(t)} className="glass rounded-full px-3 py-1.5 text-xs">
                  #{t} <span className="text-muted-foreground">· {n}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Latest</h2>
          </div>
          {videos.length === 0 ? (
            <div className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
              <Sparkles className="h-6 w-6 text-primary" />
              <div className="text-sm font-medium">No videos yet</div>
              <div className="text-xs text-muted-foreground">When creators start uploading, you'll find them here.</div>
              <Link to="/create" className="bg-gradient-primary mt-2 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow">
                Be the first to upload
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(videos as any[]).map((v) => (
                <Link key={v.id} to="/" className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                  {v.thumbnail_url && <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <div className="text-[10px] opacity-80">@{v.profiles?.handle}</div>
                    <div className="line-clamp-1 text-xs font-medium">{v.caption}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
