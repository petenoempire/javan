import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { VideoCard } from "@/components/VideoCard";
import { CommentDrawer } from "@/components/CommentDrawer";
import { ReportDialog } from "@/components/ReportDialog";
import { fetchFeed } from "@/lib/feed";
import { useAuth } from "@/lib/auth";
import { motion } from "motion/react";
import { Sparkles, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admiralty — For You" },
      { name: "description", content: "Real creators. Real stories. Admiralty is a community-first short-video network." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<{ type: "video"; id: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["feed", tab, user?.id ?? null],
    queryFn: () => fetchFeed({ followingOf: tab === "following" ? user?.id ?? null : null, userId: user?.id ?? null }),
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setActiveIdx(Number((e.target as HTMLElement).dataset.idx));
      }),
      { root: el, threshold: 0.7 },
    );
    el.querySelectorAll("[data-idx]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [videos.length]);

  return (
    <MobileShell immersive>
      <div className="absolute left-1/2 top-4 z-40 flex -translate-x-1/2 gap-6 text-sm font-semibold text-white">
        {(["following", "foryou"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative px-1 py-1">
            <span className={tab === t ? "text-white" : "text-white/60"}>
              {t === "foryou" ? "For You" : "Following"}
            </span>
            {tab === t && <motion.div layoutId="feed-tab" className="bg-gradient-primary mx-auto mt-1 h-0.5 w-6 rounded-full" />}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-[100dvh] items-center justify-center bg-black text-white/60 text-sm">Loading feed…</div>
      ) : videos.length === 0 ? (
        <EmptyFeed tab={tab} />
      ) : (
        <div ref={containerRef} className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll">
          {videos.map((v, i) => (
            <div key={v.id} data-idx={i}>
              <VideoCard
                video={v}
                active={i === activeIdx}
                onComment={() => setCommentsFor(v.id)}
                onShare={() => navigator.share?.({ title: v.caption || "Admiralty", url: location.href }).catch(() => {})}
                onReport={() => setReportFor({ type: "video", id: v.id })}
              />
            </div>
          ))}
        </div>
      )}

      <CommentDrawer videoId={commentsFor} onClose={() => setCommentsFor(null)} />
      <ReportDialog target={reportFor} onClose={() => setReportFor(null)} />
    </MobileShell>
  );
}

function EmptyFeed({ tab }: { tab: "foryou" | "following" }) {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-8 text-center text-white">
      <div className="bg-gradient-primary mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-bold">
        {tab === "following" ? "No posts from people you follow yet" : "The feed starts with you"}
      </h2>
      <p className="mt-2 max-w-xs text-sm text-white/70">
        {tab === "following"
          ? "Follow creators you love and their videos will appear here."
          : "Admiralty is brand new. Be the first to share a video and start your community."}
      </p>
      <Link to="/create" className="bg-gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
        <Plus className="h-4 w-4" /> Upload a video
      </Link>
    </div>
  );
}
