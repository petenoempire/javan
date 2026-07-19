import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { VideoCard } from "@/components/VideoCard";
import { CommentDrawer } from "@/components/CommentDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchFeed } from "@/lib/feed";
import { Users, UserPlus } from "lucide-react";

export const Route = createFileRoute("/friends")({
  head: () => ({
    meta: [
      { title: "Friends · Javan" },
      { name: "description", content: "Watch videos from creators you and your mutual followers both follow on Javan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Friends · Javan" },
      { property: "og:description", content: "Watch videos from creators you and your mutual followers both follow on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/friends" },
      { name: "twitter:title", content: "Friends · Javan" },
      { name: "twitter:description", content: "Watch videos from creators you and your mutual followers both follow on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/friends" }],
  }),
  component: FriendsFeed,
});

function FriendsFeed() {
  const { user } = useAuth();
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Mutual followers = intersection of "I follow them" and "they follow me"
  const { data: mutualIds } = useQuery({
    queryKey: ["mutuals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [iFollow, theyFollow] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", user!.id),
        supabase.from("follows").select("follower_id").eq("following_id", user!.id),
      ]);
      const a = new Set((iFollow.data ?? []).map((r) => r.following_id));
      return (theyFollow.data ?? []).map((r) => r.follower_id).filter((id) => a.has(id));
    },
  });

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["friends-feed", user?.id, mutualIds?.length ?? 0],
    enabled: !!user && Array.isArray(mutualIds),
    queryFn: async () => {
      if (!mutualIds || mutualIds.length === 0) return [];
      const feed = await fetchFeed({ userId: user?.id ?? null });
      return feed.filter((v) => mutualIds.includes(v.user_id));
    },
  });

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setActiveIdx(Number((e.target as HTMLElement).dataset.idx));
      }),
      { root: el, threshold: 0.7 },
    );
    el.querySelectorAll("[data-idx]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [videos.length]);

  if (!user) {
    return (
      <MobileShell>
        <h1 className="sr-only">Friends</h1>
        <Empty
          title="Sign in to see friends"
          body="Your mutual followers' posts show up here."
          cta={<Link to="/auth" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Sign in</Link>}
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell immersive>
      <h1 className="sr-only">Friends</h1>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-black/55 via-black/15 to-transparent pb-3 pt-3">
        <div className="pointer-events-auto flex items-center justify-center gap-2">
          <div className="glass-strong inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-white">
            <Users className="h-3.5 w-3.5" /> Friends
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[100dvh] items-center justify-center bg-black text-sm text-white/60">Loading…</div>
      ) : videos.length === 0 ? (
        <Empty
          title="No mutuals posting yet"
          body="When you and someone follow each other, their videos appear here."
          cta={<Link to="/discover" className="bg-gradient-primary mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"><UserPlus className="h-4 w-4" /> Find people</Link>}
        />
      ) : (
        <div ref={ref} className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll">
          {videos.map((v, i) => (
            <div key={v.id} data-idx={i}>
              <VideoCard
                video={v}
                active={i === activeIdx}
                onComment={() => setCommentsFor(v.id)}
                onShare={() => import("@/lib/share").then(({ shareOrCopy }) => shareOrCopy({ title: v.caption || "Javan", url: location.href }))}
                onReport={() => {}}
              />
            </div>
          ))}
        </div>
      )}
      <CommentDrawer videoId={commentsFor} onClose={() => setCommentsFor(null)} />
    </MobileShell>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-8 text-center text-white">
      <div className="bg-gradient-primary mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
        <Users className="h-7 w-7 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-xs text-sm text-white/70">{body}</p>
      {cta}
    </div>
  );
}
