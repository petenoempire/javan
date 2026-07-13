Import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { VideoCard } from "@/components/VideoCard";
import { CommentDrawer } from "@/components/CommentDrawer";
import { ReportDialog } from "@/components/ReportDialog";
import { StoryTray } from "@/components/StoryTray";
import { fetchFeed } from "@/lib/feed";
import { fetchActiveStreams } from "@/lib/live";
import { useAuth } from "@/lib/auth";
import { motion } from "motion/react";
import { Sparkles, Plus, Tv, Search, Radio, Users, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Javan — For You" },
      { name: "description", content: "Real creators. Real stories. Javan is a community-first short-video network." },
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
        <LiveGrid />
      ) : isLoading ? (
        <div className="flex h-[100dvh] items-center justify-center bg-black text-white/60 text-sm">Loading feed…</div>
      ) : videos.length === 0 ? (
        <>
          <div className="pointer-events-auto absolute inset-x-0 top-10 z-30">
            <StoryTray />
          </div>
          <EmptyFeed tab={tab} />
        </>
      ) : (
        <div ref={containerRef} className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll">
          {tab === "foryou" && (
            <div className="pointer-events-auto absolute inset-x-0 top-10 z-30">
              <StoryTray />
            </div>
          )}
          {videos.map((v, i) => (
            <div key={v.id} data-idx={i}>
              <VideoCard
                video={v}
                active={i === activeIdx}
                onComment={() => setCommentsFor(v.id)}
                onShare={() => import("@/lib/share").then(({ shareOrCopy }) => shareOrCopy({ title: v.caption || "Javan", url: location.href }))}
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

function LiveGrid() {
  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["live-active"],
    queryFn: () => fetchActiveStreams(),
    refetchInterval: 20_000,
  });

  if (isLoading) {
    return <div className="flex h-[100dvh] items-center justify-center bg-black text-white/60 text-sm">Loading LIVE…</div>;
  }

  if (streams.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-8 text-center text-white">
        <div className="bg-gradient-primary mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
          <Tv className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">No live streams right now</h2>
        <p className="mt-2 max-w-xs text-sm text-white/70">Be the first — start a LIVE from the create studio and your room lights up here.</p>
        <Link to="/create" className="bg-gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
          <Radio className="h-4 w-4" /> Go LIVE
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-black px-3 pb-28 pt-20">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white live-pulse">
          <Radio className="h-3 w-3" /> Live
        </span>
        <span className="text-xs text-white/60">{streams.length} rooms open</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {streams.map((s) => (
          <Link
            key={s.id}
            to="/live/$id"
            params={{ id: s.id }}
            className="relative aspect-[9/14] overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-900/40 via-black to-rose-900/30 shadow-elegant active:scale-[0.98]"
          >
            {s.host.avatar_url && (
              <img src={s.host.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
            <div className="absolute inset-x-2 top-2 flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white live-pulse">
                <Radio className="h-2.5 w-2.5" /> Live
              </span>
              <span className="glass flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <Users className="h-2.5 w-2.5" /> {s.viewer_count || 1}
              </span>
            </div>
            <div className="absolute inset-x-2 bottom-2 text-white">
              <div className="flex items-center gap-1 text-xs font-semibold">
                @{s.host.handle}
                {s.host.is_verified && <BadgeCheck className="h-3 w-3 text-accent" />}
              </div>
              {s.title && <div className="truncate text-[10px] text-white/80">{s.title}</div>}
            </div>
          </Link>
        ))}
      </div>
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
    foryou: { title: "The feed starts with you", body: "Javan is brand new. Be the first to share a video and start your community." },
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