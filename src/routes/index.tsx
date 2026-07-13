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

  const bytesTracked = useRef<number>(0);
  const sessionStartTime = useRef<number>(Date.now());
  const userRegion = useMemo(() => {
    if (!user?.country) return "GLOBAL";
    const c = user.country.toUpperCase();
    if (c === "GB" || c === "UK" || c === "UNITED KINGDOM") return "UK";
    if (c === "US" || c === "USA" || c === "UNITED STATES") return "USA";
    if (c === "NG" || c === "NIGERIA") return "NG";
    return "GLOBAL";
  }, [user?.country]);

  useEffect(() => {
    const syncSessionTelemetry = async () => {
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const mbConsumed = parseFloat((bytesTracked.current / (1024 * 1024)).toFixed(2));
      if (duration === 0 && mbConsumed === 0) return;
      try {
        await fetch("/api/v1/analytics/session-heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user?.id || "anonymous", session_duration_seconds: duration, megabytes_consumed: mbConsumed, ads_served_count: Math.floor(mbConsumed / 50) })
        });
        if (mbConsumed >= 50) queryClient.invalidateQueries({ queryKey: ["feed", tab] });
      } catch (err) { console.error("Telemetry heartbeat failed", err); }
    };
    const heartbeatInterval = setInterval(syncSessionTelemetry, 30000);
    const simulateVideoChunkDownload = () => { bytesTracked.current += Math.floor(Math.random() * 8000000) + 4000000; };
    (window as any).__javanLoadVideoChunk = simulateVideoChunkDownload;
    return () => { clearInterval(heartbeatInterval); syncSessionTelemetry(); };
  }, [user?.id, tab, queryClient]);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["feed", tab, user?.id ?? null, userRegion],
    queryFn: () => fetchFeed({ followingOf: tab === "following" ? user?.id ?? null : null, userId: user?.id ?? null }),
    enabled: tab !== "live",
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setActiveIdx(Number((e.target as HTMLElement).dataset.idx));
          if ((window as any).__javanLoadVideoChunk) (window as any).__javanLoadVideoChunk();
        }
      }), { root: el, threshold: 0.7 });
    el.querySelectorAll("[data-idx]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [videos.length]);

  return (
    <MobileShell immersive>
      <div className="relative h-full w-full bg-black text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 bg-gradient-to-b from-black/70 to-transparent pb-4 pt-3">
          <div className="pointer-events-auto flex items-center gap-2 px-3">
            <div className="no-scrollbar -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${tab === t.key ? "text-white" : "text-white/60"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tab === "live" ? <LiveGrid regionalContext={userRegion} /> : isLoading ? (
          <div className="flex h-[100dvh] items-center justify-center">Loading...</div>
        ) : videos.length === 0 ? <EmptyFeed tab={tab} /> : (
          <div ref={containerRef} className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll bg-black">
            {videos.map((v, i) => (
              <div key={v.id} data-idx={i} className="h-[100dvh] w-full snap-start relative">
                <VideoCard video={v} active={i === activeIdx} onComment={() => setCommentsFor(v.id)} onReport={() => setReportFor({ type: "video", id: v.id })} />
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
  const { data: streams = [] } = useQuery({ queryKey: ["live-active", regionalContext], queryFn: () => fetchActiveStreams() });
  return <div className="h-[100dvh] overflow-y-auto bg-black px-3 pt-20">
    <div className="grid grid-cols-2 gap-3">{streams.map((s) => <div key={s.id} className="aspect-[9/14] rounded-2xl bg-neutral-900" />)}</div>
  </div>;
}

function EmptyFeed({ tab }: { tab: Tab }) {
  return <div className="flex h-[100dvh] items-center justify-center text-white">No content found.</div>;
}
