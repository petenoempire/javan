import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("foryou");
  const [activeIdx, setActiveIdx] = useState(0);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<{ type: "video"; id: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Module 7: Bandwidth and Watch-Time Telemetry Metrics Tracking
  const bytesTracked = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const lastHeartbeatTime = useRef<number>(Date.now());

  // Module 1: Client-side Regional Configuration Engine
  const userRegion = useMemo(() => {
    if (!user?.country) return "GLOBAL";
    const c = user.country.toUpperCase();
    if (c === "GB" || c === "UK" || c === "UNITED KINGDOM") return "UK";
    if (c === "US" || c === "USA" || c === "UNITED STATES") return "USA";
    if (c === "NG" || c === "NIGERIA") return "NG";
    return "GLOBAL";
  }, [user?.country]);

  // Module 7 & 8: Telemetry Batching & Retention Optimization Loop
  useEffect(() => {
    const syncSessionTelemetry = async () => {
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const mbConsumed = parseFloat((bytesTracked.current / (1024 * 1024)).toFixed(2));
      
      if (duration === 0 && mbConsumed === 0) return;

      try {
        await fetch("/api/v1/analytics/session-heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user?.id || "anonymous",
            session_duration_seconds: duration,
            megabytes_consumed: mbConsumed,
            ads_served_count: Math.floor(mbConsumed / 50)
          })
        });

        // Module 8: Content Loop Optimization Re-ranking trigger (Spike > 50MB)
        if (mbConsumed >= 50) {
          queryClient.invalidateQueries({ queryKey: ["feed", tab] });
        }
      } catch (err) {
        console.error("Telemetry heartbeat failed to dispatch", err);
      }
    };

    const heartbeatInterval = setInterval(syncSessionTelemetry, 30000);

    // Track data usage dynamically per video snap
    const simulateVideoChunkDownload = () => {
      bytesTracked.current += Math.floor(Math.random() * 8000000) + 4000000; // ~4-12MB per video
    };
    (window as any).__javanLoadVideoChunk = simulateVideoChunkDownload;

    return () => {
      clearInterval(heartbeatInterval);
      syncSessionTelemetry();
    };
  }, [user?.id, tab, queryClient]);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["feed", tab, user?.id ?? null, userRegion],
    queryFn: () => fetchFeed({ followingOf: tab === "following" ? user?.id ?? null : null, userId: user?.id ?? null }),
    enabled: tab !== "live",
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setActiveIdx(Number((e.target as HTMLElement).dataset.idx));
          if ((window as any).__javanLoadVideoChunk) {
            (window as any).__javanLoadVideoChunk();
          }
        }
      }),
      { root: el, threshold: 0.7 },
    );
    el.querySelectorAll("[data-idx]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [videos.length]);

  // Module 1: Dynamic Regional Visual Themes Clamping
  const getRegionalLayoutStyles = () => {
    if (tab === "live") return "bg-black text-white";
    switch (userRegion) {
      case "UK": return "border-x border-blue-500/20 bg-slate-950 text-slate-100";
      case "USA": return "shadow-[inset_0_0_50px_rgba(59,130,246,0.1)] bg-neutral-950 text-neutral-50";
      case "NG": return "bg-black text-emerald-50 selection:bg-emerald-500/20 shadow-[inset_0_0_60px_rgba(16,185,129,0.08)]";
      default: return "bg-black text-white";
    }
  };

  return (
    <MobileShell immersive>
      <div className={`relative h-full w-full transition-all duration-300 ${getRegionalLayoutStyles()}`}>
        
        {/* Top bar — premium tabs + regional flags indicators */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-black/70 via-black/25 to-transparent pb-4 pt-3">
          <div className="pointer-events-auto flex items-center gap-2 px-3">
            <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1">
              {TABS.map((t) => {
                const active = tab === t.key;
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      active ? "text-white" : "text-white/60"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="home-tab-pill"
                        className={`absolute inset-0 -z-10 rounded-full ${
                          userRegion === "UK" ? "bg-gradient-to-r from-blue-600 via-white/10 to-red-600" :
                          userRegion === "USA" ? "bg-gradient-to-r from-blue-700 to-red-600 shadow-md" :
                          userRegion === "NG" ? "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" :
                          "bg-gradient-to-r from-fuchsia-600 to-pink-600"
                        }`}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {t.label}
                      {t.key === "foryou" && userRegion === "NG" && " 🇳🇬 (1.25x)"}
                      {t.key === "foryou" && userRegion === "UK" && " 🇬🇧"}
                      {t.key === "foryou" && userRegion === "USA" && " 🇺🇸"}
                    </span>
                  </button>
                );
              })}
            </div>
            <Link
              to="/discover"
              aria-label="Search"
              className="glass-strong ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white bg-white/10 active:scale-90 transition-transform"
            >
              <Search className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {tab === "live" ? (
          <LiveGrid regionalContext={userRegion} />
        ) : isLoading ? (
          <div className="flex h-[100dvh] items-center justify-center bg-black text-white/40 text-xs tracking-widest uppercase">Syncing Regional Feed...</div>
        ) : videos.length === 0 ? (
          <>
            <div className="pointer-events-auto absolute inset-x-0 top-10 z-30">
              <StoryTray />
            </div>
            <EmptyFeed tab={tab} />
          </>
        ) : (
          <div ref={containerRef} className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll bg-black">
            {tab === "foryou" && (
              <div className="pointer-events-auto absolute inset-x-0 top-10 z-30">
                <StoryTray />
              </div>
            )}
            {videos.map((v, i) => (
              <div key={v.id} data-idx={i} className="h-[100dvh] w-full snap-start relative">
                <VideoCard
                  video={v}
                  active={i === activeIdx}
                  onComment={() => setCommentsFor(v.id)}
                  onShare={() => import("@/lib/share").then(({ shareOrCopy }) => shareOrCopy({ title: v.caption || "Javan", url: location.href }))}
                  onReport={() => setReportFor({ type: "video", id: v.id })}
                />

                {/* ─── INTERACTIVE STREAMING SOUND METADATA OVERLAY LAYER ─── */}
                {/* <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 px-4">
                  <div className="pointer-events-auto border border-white/5 bg-neutral-950/80 backdrop-blur-md rounded-xl p-2.5 flex items-center justify-between max-w-[calc(100%-64px)] shadow-2xl">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900 border border-white/10 text-rose-400">
                        <svg className={`h-4 w-4 text-rose-400 ${i === activeIdx ? "animate-spin" : ""}`} style={{ animationDuration: '4s', animationTimingFunction: 'linear' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 border border-black animate-pulse" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-black tracking-tight text-white uppercase">
                          {v.audio_tracks?.title || v.music || "Original Audio"}
                        </div>
                        <div className="truncate text-[8px] font-mono font-bold text-neutral-500 uppercase tracking-widest mt-0.5">
                          Node: {v.audio_tracks?.artist_name || "Unknown Identity Vector"}
                        </div>
                      </div>
                    </div>

                    {v.audio_track_id && (
                      <Link
                        to="/create"
                        search={{ soundId: v.audio_track_id }}
                        className="ml-3 shrink-0 flex h-6 px-2.5 items-center justify-center rounded-lg bg-white text-black hover:bg-rose-500 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-md"
                      >
                        Use Sound
                      </Link>
                    )}
                  </div>
                </div>
                */}
              </div>
            ))}
          </div>
        )}

        <CommentDrawer videoId={commentsFor} onClose={() => setCommentsFor(null)} />
        <ReportDialog target={reportFor} onClose={() => setReportFor(null)} />
      </div>
    </MobileShell>
  );
}

function LiveGrid({ regionalContext }: { regionalContext: string }) {
  const { data: streams = [], isLoading } = useQuery({
    queryKey: ["live-active", regionalContext],
    queryFn: () => fetchActiveStreams(),
    refetchInterval: 20_000,
  });

  if (isLoading) {
    return <div className="flex h-[100dvh] items-center justify-center bg-black text-white/60 text-sm">Loading LIVE Feed…</div>;
  }

  if (streams.length === 0) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-black px-8 text-center text-white">
        <div className="bg-gradient-primary mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow">
          <Tv className="h-8 w-8 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl font-bold">No live streams right now</h2>
        <p className="mt-2 max-w-xs text-sm text-white/70">Be the first — start a LIVE room from the studio.</p>
        <Link to="/create" className="bg-gradient-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
          <Radio className="h-4 w-4" /> Go LIVE
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-y-auto bg-black px-3 pb-28 pt-20">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
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
            className="relative aspect-[9/14] overflow-hidden rounded-2xl bg-neutral-900 shadow-md active:scale-[0.98] transition-transform"
          >
            {s.host.avatar_url && (
              <img src={s.host.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
            <div className="absolute inset-x-2 top-2 flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                Live
              </span>
              <span className="glass flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white bg-black/40">
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
    following: { title: "No posts from people you love yet", body: "Follow creators you love and their videos will appear here." },
    foryou: { title: "The feed starts with you", body: "Javan is brand new. Be the first to share a video." },
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
