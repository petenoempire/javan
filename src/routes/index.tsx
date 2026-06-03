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
import { Sparkles, Plus, Tv, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boogle — For You" },
      { name: "description", content: "Real creators. Real stories. Boogle is a community-first short-video network." },
    ],
  }),
  component: FeedPage,
});

type Tab = "live" | "drama" | "community" | "stem" | "following" | "foryou";
const TABS: { key: Tab; label: string; icon?: typeof Tv }[] = [
  { key: "live", label: "Live", icon: Tv },
  { key: "drama", label: "Drama" },
  { key: "community", label: "Community" },
  { key: "stem", label: "STEM" },
  { key: "following", label: "Following" },
  { key: "foryou", label: "For You" },
];

function FeedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("foryou");
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<{ type: "video"; id: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["feed", tab, user?.id ?? null],
    queryFn: () => fetchFeed({ followingOf: tab === "following" ? user?.id ?? null : null, userId: user?.id ?? null }),
    enabled: tab !== "live",
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
      {/* Top bar — premium capsule tabs + search */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-black/55 via-black/20 to-transparent pb-4 pt-3">
        <div className="pointer-events-auto flex items-center gap-2 pl-3 pr-3">
          <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active ? "text-white" : "text-white/65"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="home-tab-pill"
                      className="bg-gradient-primary absolute inset-0 -z-10 rounded-full shadow-glow"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          <Link
            to="/discover"
            aria-label="Search"
            className="glass-strong ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-elegant active:scale-90"
          >
            <Search className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {tab === "live" ? (
        <LivePlaceholder />
      ) : isLoading ? (
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
                onShare={() => navigator.share?.({ title: v.caption || "Boogle", url: location.href }).catch(() => {})}
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

function LivePlaceholder() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-8 text-center text-white">
      <div className="bg-gradient-primary mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
        <Tv className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-bold">Live streams</h2>
      <p className="mt-2 max-w-xs text-sm text-white/70">No one is streaming right now. Check back soon — this feed lights up the moment creators go live.</p>
    </div>
  );
}

function EmptyFeed({ tab }: { tab: Tab }) {
  const copy: Record<Tab, { title: string; body: string }> = {
    live: { title: "", body: "" },
    drama: { title: "No drama posts yet", body: "Cinematic shorts, scripted scenes and serials will land here." },
    community: { title: "Community is just getting started", body: "Conversations, micro-vlogs and town-hall style posts will appear here." },
    stem: { title: "STEM channel is empty", body: "Science, tech, engineering and math creators welcome." },
    following: { title: "No posts from people you follow yet", body: "Follow creators you love and their videos will appear here." },
    foryou: { title: "The feed starts with you", body: "Boogle is brand new. Be the first to share a video and start your community." },
  };
  const c = copy[tab];
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-8 text-center text-white">
      <div className="bg-gradient-primary mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
        <Sparkles className="h-7 w-7 text-primary-foreground" />
      </div>
      <h2 className="font-display text-2xl font-bold">{c.title}</h2>
      <p className="mt-2 max-w-xs text-sm text-white/70">{c.body}</p>
      <Link to="/create" className="bg-gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
        <Plus className="h-4 w-4" /> Upload a video
      </Link>
    </div>
  );
}
