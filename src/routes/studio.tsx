import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Settings, Video, Radio, TrendingUp, TrendingDown, UserPlus, Heart, Eye,
  Sparkles, Gift, Gamepad2, Music2, BadgeCheck, ChevronRight, Megaphone, Award,
  GraduationCap, ShieldCheck, Plus, Camera, Crown,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/studio")({
  head: () => ({ meta: [{ title: "Creator Studio · Javan" }] }),
  component: CreatorStudio,
});

function CreatorStudio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [tab, setTab] = useState<"posts" | "live">("posts");

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

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
      return { views, followers: followers.data?.length ?? 0, likes: likes.data?.length ?? 0, recentFollowers, recentLikes };
    },
  });

  if (pathname !== "/studio") return <Outlet />;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-muted/40 pb-24 dark:bg-background">
      <header className="sticky top-0 z-10 flex items-center border-b border-border/40 bg-background/95 px-2 py-3 backdrop-blur">
        <Link to="/profile" className="p-2" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="flex-1 text-center font-display text-base font-bold">Creator Studio</h1>
        <Link to="/settings" className="p-2" aria-label="Settings"><Settings className="h-5 w-5" /></Link>
      </header>

      <div className="mx-3 mt-3 grid grid-cols-2 rounded-full bg-muted/60 p-1">
        {(["posts", "live"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-full py-2 text-sm font-bold transition ${tab === t ? "bg-background text-foreground shadow-elegant" : "text-muted-foreground"}`}>
            {t === "posts" ? "Posts" : "LIVE"}
          </button>
        ))}
      </div>

      {tab === "posts" ? <PostsView stats={stats} /> : <LiveView />}

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-border/40 bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/create"
          className="bg-gradient-primary flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-primary-foreground shadow-glow">
          {tab === "posts" ? <><Camera className="h-4 w-4" /> Start creating</> : <><Radio className="h-4 w-4" /> Go LIVE</>}
        </Link>
      </div>
    </div>
  );
}

function PostsView({ stats }: { stats: any }) {
  return (
    <div className="space-y-4 px-3 pt-4">
      {/* Analytics */}
      <Card>
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last 7 days</span>
          <Link to="/studio/$section" params={{ section: "analytics" }} className="text-xs font-semibold text-sky-500">View all</Link>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          <Metric icon={Eye} label="Post views" value={stats?.views ?? 0} section="analytics" up />
          <Metric icon={UserPlus} label="Net followers" value={stats?.recentFollowers ?? 0} section="analytics" up={(stats?.recentFollowers ?? 0) >= 0} />
          <Metric icon={Heart} label="Likes" value={stats?.recentLikes ?? 0} section="analytics" up />
        </div>
      </Card>

      {/* Monetization */}
      <div className="grid grid-cols-2 gap-3">
        <BigTile section="service" tone="primary" icon={Crown} title="Service+" desc="Boost your reach" />
        <BigTile section="live-rewards" tone="gold" icon={Gift} title="LIVE rewards" desc="Track gifts received" />
      </div>

      <div className="no-scrollbar -mx-3 flex gap-2 overflow-x-auto px-3">
        {[
          { icon: Sparkles, label: "Subscription", section: "subscriptions" },
          { icon: Music2, label: "Work with Artists", to: "/artist/onboarding" as const },
          { icon: Gift, label: "Video Gifts", section: "video-gifts" },
          { icon: Gamepad2, label: "Gaming Incentive", section: "gaming" },
        ].map((c) => (
          <RevenueTile key={c.label} {...c} />
        ))}
      </div>

      <Link to="/studio/$section" params={{ section: "monetization" }} className="glass flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold active:scale-[0.98]">
        <span>More ways to get paid</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* More tools */}
      <SectionTitle>More tools</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        <ToolTile to="/settings/account/verification" icon={ShieldCheck} label="Account check" />
        <ToolTile section="promote" icon={Megaphone} label="Promote" />
        <ToolTile section="benefits" icon={Award} label="Benefits" />
      </div>

      {/* Creator Academy */}
      <SectionTitle>Creator Academy</SectionTitle>
      <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3">
        {[
          { title: "Hooks that hold viewers", min: "4 min" },
          { title: "Lighting like a pro", min: "6 min" },
          { title: "Caption strategy 101", min: "3 min" },
          { title: "Your first 1k followers", min: "5 min" },
        ].map((c) => (
          <button key={c.title} className="glass min-w-[180px] shrink-0 overflow-hidden rounded-2xl text-left active:scale-[0.98]">
            <div className="bg-gradient-primary relative h-24">
              <GraduationCap className="absolute right-3 top-3 h-5 w-5 text-primary-foreground/80" />
            </div>
            <div className="p-3">
              <div className="text-xs font-bold">{c.title}</div>
              <div className="text-[10px] text-muted-foreground">{c.min}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function LiveView() {
  const [dot, setDot] = useState(0);
  const carousel = [
    { title: "Let your true self shine", body: "Show up live and grow real connection." },
    { title: "Grow your audience", body: "Consistency on LIVE multiplies follower velocity." },
    { title: "Monetize your LIVE", body: "Gifts, subs and creator rewards stack up." },
  ];

  useEffect(() => { const t = setInterval(() => setDot((d) => (d + 1) % carousel.length), 4000); return () => clearInterval(t); }, []);

  return (
    <div className="space-y-4 px-3 pt-4">
      <Card>
        <div className="p-5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">LIVE program</div>
          <div className="mt-2 font-display text-lg font-bold">{carousel[dot].title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{carousel[dot].body}</div>
          <div className="mt-4 flex gap-1.5">
            {carousel.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === dot ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40"}`} />
            ))}
          </div>
        </div>
      </Card>

      <SectionTitle>LIVE Academy</SectionTitle>
      <Card>
        {[
          { icon: Sparkles, title: "LIVE is fun!", body: "Start with a quick 5-minute hello stream." },
          { icon: Radio, title: "3 steps to start LIVE", body: "Plan, set the stage, and engage." },
          { icon: ShieldCheck, title: "LIVE safety", body: "Tools, moderation and community standards." },
        ].map((r, i) => (
          <div key={r.title} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/40" : ""}`}>
            <div className="bg-primary/10 ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
              <r.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold">{r.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">{r.body}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        ))}
      </Card>

      <SectionTitle>Suggested LIVE creators</SectionTitle>
      <div className="no-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass min-w-[140px] overflow-hidden rounded-2xl">
            <div className="bg-gradient-primary relative aspect-[3/4]">
              <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">LIVE</span>
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white"><Eye className="h-3 w-3" /> 1.2k</span>
            </div>
            <div className="flex items-center gap-2 p-2">
              <div className="bg-muted h-7 w-7 rounded-full" />
              <div className="min-w-0 text-[11px] font-bold">@creator{i + 1}</div>
              <BadgeCheck className="h-3 w-3 fill-accent text-background" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, section, up }: { icon: any; label: string; value: number; section: string; up?: boolean }) {
  return (
    <Link to="/studio/$section" params={{ section }} className="rounded-2xl bg-muted/40 p-3 text-left active:scale-95">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-xl font-bold">{value.toLocaleString()}</span>
        {up ? <TrendingUp className="h-3 w-3 text-emerald-500" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
      </div>
    </Link>
  );
}

function BigTile({ section, tone, icon: Icon, title, desc }: { section: string; tone: "primary" | "gold"; icon: any; title: string; desc: string }) {
  return (
    <Link to="/studio/$section" params={{ section }} className={`relative overflow-hidden rounded-2xl p-4 shadow-elegant ${tone === "primary" ? "bg-gradient-primary text-primary-foreground" : "bg-gradient-gold text-black"}`}>
      <Icon className="mb-3 h-6 w-6 opacity-90" />
      <div className="font-display text-base font-bold">{title}</div>
      <div className="text-[11px] opacity-80">{desc}</div>
      <Plus className="absolute right-3 top-3 h-4 w-4 opacity-70" />
    </Link>
  );
}

function RevenueTile({ icon: Icon, label, section, to }: { icon: any; label: string; section?: string; to?: "/artist/onboarding" }) {
  const body = (
    <>
      <div className="bg-gradient-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-glow">
        <Icon className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="text-[11px] font-bold leading-tight">{label}</div>
    </>
  );
  if (section) {
    return <Link to="/studio/$section" params={{ section }} className="glass flex min-w-[130px] shrink-0 flex-col gap-2 rounded-2xl p-3">{body}</Link>;
  }
  return <Link to={to!} className="glass flex min-w-[130px] shrink-0 flex-col gap-2 rounded-2xl p-3">{body}</Link>;
}

function ToolTile({ to, section, icon: Icon, label }: { to?: "/settings/account/verification"; section?: string; icon: any; label: string }) {
  const body = (
    <>
      <div className="bg-primary/10 ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="text-[11px] font-bold leading-tight">{label}</div>
    </>
  );
  if (section) {
    return <Link to="/studio/$section" params={{ section }} className="glass flex flex-col items-center gap-2 rounded-2xl p-3 text-center active:scale-95">{body}</Link>;
  }
  return (
    <Link to={to!} className="glass flex flex-col items-center gap-2 rounded-2xl p-3 text-center active:scale-95">{body}</Link>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl bg-background shadow-sm">{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-1 pt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</div>;
}
