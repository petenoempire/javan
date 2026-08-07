import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Settings, Video, Radio, TrendingUp, TrendingDown, UserPlus, Heart, Eye,
  Sparkles, Gift, Gamepad2, Music2, BadgeCheck, ChevronRight, Megaphone, Award,
  GraduationCap, ShieldCheck, Plus, Camera, Crown, Star, Wallet, Zap,
  BarChart3, Users, DollarSign, Play, BookOpen, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PAGE_TITLE = "Creator Studio · Javan";
const PAGE_DESC = "Track your views, followers, and earnings, and access creator tools and monetization on Javan.";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/studio" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/studio" }],
  }),
  component: CreatorStudio,
});

function CreatorStudio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [tab, setTab] = useState<"posts" | "live">("posts");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["studio-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
      const [videos, followers, likes] = await Promise.all([
        supabase.from("videos").select("views,created_at").eq("user_id", user!.id),
        supabase.from("follows").select("created_at").eq("following_id", user!.id),
        supabase.from("video_likes").select("created_at,video_id,videos!inner(user_id)").eq("videos.user_id", user!.id),
      ]);
      const views = (videos.data ?? []).reduce((s, v: any) => s + (v.views ?? 0), 0);
      const recentFollowers = (followers.data ?? []).filter((r: any) => r.created_at > since).length;
      const recentLikes = (likes.data ?? []).filter((r: any) => r.created_at > since).length;
      return {
        views,
        followers: followers.data?.length ?? 0,
        likes: likes.data?.length ?? 0,
        recentFollowers,
        recentLikes,
      };
    },
  });

  if (pathname !== "/studio") return <Outlet />;

  return (
    <div className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={() => navigate({ to: "/profile" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back to profile">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Creator</p>
          <h1 className="font-display text-lg font-black text-chrome">Studio</h1>
        </div>
        <Link to="/settings" className="p-2 rounded-full hover:bg-white/10 active:scale-90" aria-label="Settings">
          <Settings className="h-5 w-5 text-white/70" />
        </Link>
      </div>

      {/* Tab Switcher */}
      <div className="relative z-10 flex gap-1 px-4 py-3 border-b border-white/5">
        <button
          onClick={() => setTab("posts")}
          className={`flex items-center gap-1.5 flex-1 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
            tab === "posts" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          <Video className="h-3.5 w-3.5" /> Posts
        </button>
        <button
          onClick={() => setTab("live")}
          className={`flex items-center gap-1.5 flex-1 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
            tab === "live" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          <Radio className="h-3.5 w-3.5" /> LIVE
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {tab === "posts" ? (
            <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <PostsView stats={stats} />
            </motion.div>
          ) : (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LiveView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="relative z-10 border-t border-white/5 bg-[#020210]/95 px-4 py-3 backdrop-blur">
        <Link
          to="/create"
          search={{ mode: tab === "live" ? "live" : undefined }}
          className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white shadow-glow active:scale-95 transition-all"
        >
          {tab === "posts" ? <><Camera className="h-4 w-4" /> Start creating</> : <><Radio className="h-4 w-4" /> Go LIVE</>}
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   POSTS VIEW
   ────────────────────────────────────────────── */
function PostsView({ stats }: { stats: any }) {
  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Analytics Overview */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-white/50">Last 7 days</span>
          <Link
            to="/studio/$section"
            params={{ section: "analytics" }}
            className="text-xs font-semibold text-cyan-400 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MetricCard icon={Eye} label="Views" value={stats?.views ?? 0} section="analytics" up />
          <MetricCard icon={UserPlus} label="Followers" value={stats?.recentFollowers ?? 0} section="analytics" up={(stats?.recentFollowers ?? 0) >= 0} />
          <MetricCard icon={Heart} label="Likes" value={stats?.recentLikes ?? 0} section="analytics" up />
        </div>
      </div>

      {/* Monetization Big Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <BigTile
          section="service"
          gradient="from-cyan-500 to-blue-600"
          icon={Crown}
          title="Service+"
          desc="Boost your reach"
        />
        <BigTile
          section="live-rewards"
          gradient="from-amber-400 to-orange-500"
          icon={Gift}
          title="LIVE rewards"
          desc="Track gifts"
        />
      </div>

      {/* Revenue Scroll */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { icon: Sparkles, label: "Subscription", section: "subscriptions" },
          { icon: Music2, label: "Work with Artists", to: "/artist/onboarding" as const },
          { icon: Gift, label: "Video Gifts", section: "video-gifts" },
          { icon: Gamepad2, label: "Gaming Incentive", section: "gaming" },
        ].map((c) => (
          <RevenueTile key={c.label} {...c} />
        ))}
      </div>

      {/* More Ways to Earn */}
      <Link
        to="/studio/$section"
        params={{ section: "monetization" }}
        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 active:scale-[0.98] transition-all"
      >
        <span className="text-sm font-bold">More ways to get paid</span>
        <ChevronRight className="h-4 w-4 text-white/40" />
      </Link>

      {/* More Tools */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 px-1 pt-2">More tools</h3>
      <div className="grid grid-cols-3 gap-3">
        <ToolTile to="/settings/account/verification" icon={ShieldCheck} label="Verification" />
        <ToolTile section="promote" icon={Megaphone} label="Promote" />
        <ToolTile section="benefits" icon={Award} label="Benefits" />
      </div>

      {/* Creator Academy */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 px-1 pt-4">Creator Academy</h3>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {[
          { title: "Hooks that hold viewers", min: "4 min" },
          { title: "Lighting like a pro", min: "6 min" },
          { title: "Caption strategy 101", min: "3 min" },
          { title: "Your first 1k followers", min: "5 min" },
        ].map((c) => (
          <div key={c.title} className="min-w-[160px] shrink-0 rounded-2xl bg-white/5 border border-white/10 overflow-hidden active:scale-95 transition-all">
            <div className="h-20 bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-white/30" />
            </div>
            <div className="p-3">
              <div className="text-xs font-bold line-clamp-1">{c.title}</div>
              <div className="text-[10px] text-white/40 mt-0.5 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {c.min}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   LIVE VIEW
   ────────────────────────────────────────────── */
function LiveView() {
  const [dot, setDot] = useState(0);
  const carousel = [
    { title: "Let your true self shine", body: "Show up live and grow real connection." },
    { title: "Grow your audience", body: "Consistency on LIVE multiplies follower velocity." },
    { title: "Monetize your LIVE", body: "Gifts, subs and creator rewards stack up." },
  ];
  useEffect(() => {
    const t = setInterval(() => setDot((d) => (d + 1) % carousel.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* LIVE Hero Carousel */}
      <div className="rounded-2xl bg-gradient-to-br from-rose-500/15 to-fuchsia-500/15 border border-rose-500/20 p-5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400/70">LIVE program</div>
        <div className="mt-2 font-display text-xl font-bold">{carousel[dot].title}</div>
        <div className="mt-1 text-sm text-white/60">{carousel[dot].body}</div>
        <div className="mt-4 flex gap-1.5">
          {carousel.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === dot ? "w-5 bg-rose-500" : "w-1.5 bg-white/20"}`} />
          ))}
        </div>
      </div>

      {/* LIVE Academy */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 px-1 pt-2">LIVE Academy</h3>
      <div className="rounded-2xl border border-white/10 bg-white/5 divide-y divide-white/5">
        {[
          { icon: Sparkles, title: "LIVE is fun!", body: "Start with a quick 5-minute hello stream." },
          { icon: Radio, title: "3 steps to start LIVE", body: "Plan, set the stage, and engage." },
          { icon: ShieldCheck, title: "LIVE safety", body: "Tools, moderation and community standards." },
        ].map((r, i) => (
          <div key={r.title} className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <r.icon className="h-5 w-5 text-rose-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{r.title}</div>
              <div className="truncate text-[11px] text-white/40">{r.body}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
          </div>
        ))}
      </div>

      {/* LIVE Rewards */}
      <Link
        to="/studio/$section"
        params={{ section: "live-rewards" }}
        className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-4 py-3 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">LIVE rewards</p>
            <p className="text-[10px] text-white/40">Track gifts & earnings</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-white/30" />
      </Link>

      {/* Suggested LIVE Creators */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 px-1 pt-2">Suggested LIVE creators</h3>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
        <Radio className="h-8 w-8 text-rose-500/30 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-white/40">Real LIVE creators will appear here once streaming begins.</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   REUSABLE COMPONENTS
   ────────────────────────────────────────────── */
function MetricCard({ icon: Icon, label, value, section, up }: {
  icon: any; label: string; value: number; section: string; up?: boolean;
}) {
  return (
    <Link
      to="/studio/$section"
      params={{ section }}
      className="rounded-xl bg-white/5 border border-white/5 p-3 text-left active:scale-95 transition-all"
    >
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-xl font-bold">{value.toLocaleString()}</span>
        {up ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-rose-500" />}
      </div>
    </Link>
  );
}

function BigTile({ section, gradient, icon: Icon, title, desc }: {
  section: string; gradient: string; icon: any; title: string; desc: string;
}) {
  return (
    <Link
      to="/studio/$section"
      params={{ section }}
      className={`relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${gradient} active:scale-95 transition-all`}
    >
      <Icon className="mb-3 h-6 w-6 text-white/80" />
      <div className="font-display text-base font-bold text-white">{title}</div>
      <div className="text-[11px] text-white/70 mt-0.5">{desc}</div>
      <Plus className="absolute right-3 top-3 h-4 w-4 text-white/50" />
    </Link>
  );
}

function RevenueTile({ icon: Icon, label, section, to }: {
  icon: any; label: string; section?: string; to?: "/artist/onboarding";
}) {
  const body = (
    <div className="flex min-w-[120px] shrink-0 flex-col gap-2 rounded-xl bg-white/5 border border-white/10 p-3 active:scale-95 transition-all">
      <div className="bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex h-8 w-8 items-center justify-center rounded-lg shadow-glow">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="text-[11px] font-bold leading-tight">{label}</div>
    </div>
  );
  if (section) return <Link to="/studio/$section" params={{ section }}>{body}</Link>;
  return <Link to={to!}>{body}</Link>;
}

function ToolTile({ to, section, icon: Icon, label }: {
  to?: "/settings/account/verification"; section?: string; icon: any; label: string;
}) {
  const body = (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-3 active:scale-95 transition-all">
      <div className="bg-cyan-500/10 ring-1 ring-cyan-500/20 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5 text-cyan-400" />
      </div>
      <div className="text-[11px] font-bold leading-tight">{label}</div>
    </div>
  );
  if (section) return <Link to="/studio/$section" params={{ section }}>{body}</Link>;
  return <Link to={to!}>{body}</Link>;
}
