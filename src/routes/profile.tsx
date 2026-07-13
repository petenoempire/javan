import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { MusicHub } from "@/components/MusicHub";
import { supabase } from "@/integrations/supabase/client";
import {
  Share2, Wallet, BadgeCheck, LogOut, Pencil, Link as LinkIcon, MapPin, Film, Menu,
  AudioLines, Eye, Plus, ChevronDown, Lock, Repeat2, Bookmark, Heart, LayoutGrid,
  X, Type, Folder, Calendar, Sparkles, Camera, Disc, HelpCircle, CheckCircle2, History
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Studio Core · Javan" }] }),
  component: Profile,
});

type FeedTab = "posts" | "private" | "reposts" | "bookmarks" | "liked";

function Profile() {
  const { profile, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isProfileIndex = pathname === "/profile";
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [hub, setHub] = useState<"videos" | "music">("videos");
  const [feedTab, setFeedTab] = useState<FeedTab>("posts");

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: isProfileIndex && !!user,
    queryFn: async () => {
      const [followers, following, videos, viewers] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", user!.id),
        supabase.from("videos").select("id,thumbnail_url,caption,video_url,views").eq("user_id", user!.id).eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("profile_views").select("viewer_id", { count: "exact", head: true }).eq("profile_id", user!.id),
      ]);
      const v = videos.data ?? [];
      return { followers: followers.count ?? 0, following: following.count ?? 0, videos: v, viewers: viewers.count ?? 0 };
    },
  });

  const { data: liked = [] } = useQuery({
    queryKey: ["profile-liked", user?.id],
    enabled: isProfileIndex && !!user && feedTab === "liked",
    queryFn: async () => {
      const { data: rows } = await supabase.from("video_likes").select("video_id").eq("user_id", user!.id).limit(60);
      const ids = (rows ?? []).map(r => r.video_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("videos").select("id,thumbnail_url,video_url,caption").in("id", ids).eq("status", "active");
      return data ?? [];
    },
  });

  const { data: artist } = useQuery({
    queryKey: ["my-artist-pub", user?.id],
    enabled: isProfileIndex && !!user,
    queryFn: async () => {
      const { data } = await supabase.from("artist_profiles").select("status").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });
  const isArtist = artist?.status === "approved";

  if (!isProfileIndex) return <Outlet />;

  if (loading) return <MobileShell><div className="px-5 pt-10 text-xs font-mono text-neutral-500">INITIALIZING_PROFILE_ENGINE…</div></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center bg-black">
          <div className="bg-gradient-to-tr from-fuchsia-500 to-rose-500 mb-4 h-14 w-14 rounded-full shadow-glow animate-pulse" />
          <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">Initialize Javan Node</h2>
          <p className="mt-2 text-xs text-neutral-500 max-w-xs">Establish user parameters to track sync metadata, deploy media blocks, and audit digital assets.</p>
          <Link to="/auth" className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-6 rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-glow">
            Authenticate Node Instance
          </Link>
        </div>
      </MobileShell>
    );
  }

  const feedTabs: { key: FeedTab; Icon: typeof LayoutGrid; arrow?: boolean }[] = [
    { key: "posts", Icon: LayoutGrid, arrow: true },
    { key: "private", Icon: Lock },
    { key: "reposts", Icon: Repeat2 },
    { key: "bookmarks", Icon: Bookmark },
    { key: "liked", Icon: Heart },
  ];

  const renderGrid = () => {
    if (feedTab === "liked") {
      return liked.length === 0 ? <EmptyTab label="No liked entries indexed inside target vector" /> : <Grid items={liked} />;
    }
    if (feedTab === "posts") {
      return !stats || stats.videos.length === 0
        ? <EmptyTab label="No published blocks compiled yet" cta />
        : <Grid items={stats.videos} />;
    }
    const map: Record<FeedTab, string> = {
      posts: "", liked: "",
      private: "Private array block empty.",
      reposts: "Boost indexes will assemble here.",
      bookmarks: "Saved elements will render within this node partition.",
    };
    return <EmptyTab label={map[feedTab]} />;
  };

  return (
    <MobileShell>
      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="relative bg-neutral-950 text-white select-none">
        {profile?.cover_url
          ? <img src={profile.cover_url} className="h-36 w-full object-cover border-b border-white/5" alt="" />
          : <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 h-36 w-full border-b border-white/5 opacity-40" />}

        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open context core dashboard"
          className="absolute left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950/80 border border-white/10 text-white backdrop-blur-md shadow-md active:scale-90 transition-transform"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="px-4 pb-4">
          <div className="-mt-10 flex items-end justify-between relative z-20">
            <div className="rounded-full bg-gradient-to-tr from-fuchsia-500 to-rose-500 p-0.5 shadow-glow">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="h-20 w-20 rounded-full border-4 border-neutral-950 object-cover shadow-2xl" alt="" />
                : <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 h-20 w-20 rounded-full border-4 border-neutral-950 shadow-2xl" />}
            </div>

            <div className="flex gap-1.5">
              <button 
                onClick={() => import("@/lib/share").then(({ shareOrCopy }) => shareOrCopy({ url: window.location.href, title: `@${profile?.handle} on Javan` }))}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white" 
                aria-label="Export profile route metadata"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => signOut().then(() => navigate({ to: "/auth" }))} className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 border border-white/5 text-neutral-500 hover:text-rose-400">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            <h1 className="font-display text-2xl font-black tracking-tight leading-tight">{profile?.display_name || `@${profile?.handle}`}</h1>
            {profile?.is_verified && <BadgeCheck className="h-4 w-4 fill-rose-500 text-neutral-950" />}
          </div>
          <div className="text-xs font-mono font-bold text-neutral-500">@{profile?.handle}</div>
          
          {profile?.bio && <p className="mt-1.5 text-xs font-medium text-neutral-400 leading-normal max-w-sm">{profile.bio}</p>}
          
          <div className="mt-2 flex flex-wrap gap-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            {profile?.location && <span className="flex items-center gap-1 bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-md"><MapPin className="h-2.5 w-2.5 text-rose-500" />{profile.location}</span>}
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-rose-400 bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-md transition-colors hover:bg-neutral-800">
                <LinkIcon className="h-2.5 w-2.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {/* Core Analytics Pipeline Indexes */}
          <div className="mt-4 grid grid-cols-3 gap-1.5 text-center">
            <Link to="/following" className="bg-neutral-900/60 border border-white/5 rounded-xl p-2.5 transition active:scale-95">
              <div className="font-mono text-sm font-black text-white">{(stats?.following ?? 0).toLocaleString()}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mt-0.5">Following</div>
            </Link>
            <Link to="/followers" className="bg-neutral-900/60 border border-white/5 rounded-xl p-2.5 transition active:scale-95">
              <div className="font-mono text-sm font-black text-white">{(stats?.followers ?? 0).toLocaleString()}</div>
              <div className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mt-0.5">Followers</div>
            </Link>
            <button
              type="button"
              onClick={() => navigate({ to: "/profile/viewers" })}
              className="bg-neutral-900/60 border border-white/5 rounded-xl p-2.5 text-center transition active:scale-95 relative overflow-hidden"
            >
              <div className="relative flex items-center justify-center gap-1">
                <Eye className="h-3 w-3 text-rose-400" />
                <div className="font-mono text-sm font-black text-white">{(stats?.viewers ?? 0).toLocaleString()}</div>
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest text-neutral-500 mt-0.5">Viewers</div>
            </button>
          </div>

          {/* Action Anchors */}
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => navigate({ to: "/profile/edit" })} className="bg-gradient-to-r from-fuchsia-500 to-rose-500 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-wider text-white shadow-glow active:scale-98 transition-transform">
              <Pencil className="h-3 w-3" /> Alter Profile Parameters
            </button>
            <Link to="/wallet" className="bg-neutral-900 border border-white/5 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-wider text-neutral-300 transition-colors hover:bg-neutral-800">
              <Wallet className="h-3.5 w-3.5 text-neutral-400" /> Central Ledger Wallet
            </Link>
          </div>

          {/* Studio Registry Summary Panel */}
          <div className="mt-3.5 rounded-xl border border-white/5 bg-neutral-900/30 p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-1.5">
                <Disc className="h-3.5 w-3.5 text-rose-400 animate-spin-slow" />
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Distribution Ledger Registry</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500 border border-white/5">ACTIVE</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400">
              <div className="flex flex-col bg-neutral-900/60 p-2 rounded-lg border border-white/5">
                <span className="text-[8px] uppercase tracking-wider text-neutral-500">Lyric Sync Engines</span>
                <span className="font-bold text-neutral-300 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Confirmed Ready
                </span>
              </div>
              <div className="flex flex-col bg-neutral-900/60 p-2 rounded-lg border border-white/5">
                <span className="text-[8px] uppercase tracking-wider text-neutral-500">ISRC Validation Block</span>
                <span className="font-bold text-neutral-300 mt-0.5 flex items-center gap-1">
                  <History className="h-2.5 w-2.5 text-amber-400" /> Running Sync Checks
                </span>
              </div>
            </div>
          </div>

          {/* Component Category Arrays */}
          <div className="mt-4 flex items-center justify-around border-y border-white/5 py-1.5 bg-neutral-900/20">
            {feedTabs.map(({ key, Icon, arrow }) => {
              const active = feedTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setFeedTab(key)}
                  aria-label={`Switch viewport focus to ${key}`}
                  className={`relative flex items-center gap-0.5 p-2 transition-all ${active ? "text-rose-400 scale-110" : "text-neutral-600 hover:text-neutral-400"}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 1.8} />
                  {arrow && <ChevronDown className="h-2.5 w-2.5 opacity-50" />}
                  {active && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-rose-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Music Hub Control Core */}
      {isArtist && (
        <div className="mx-4 mb-3 grid grid-cols-2 gap-1 rounded-xl bg-neutral-900 p-1 border border-white/5">
          <TabBtn active={hub === "videos"} onClick={() => setHub("videos")}><Film className="h-3.5 w-3.5" /> Published Videos Feed</TabBtn>
          <TabBtn active={hub === "music"} onClick={() => setHub("music")}>
            <div className="bg-gradient-to-tr from-fuchsia-500 to-rose-500 flex h-3.5 w-3.5 items-center justify-center rounded-full">
              <AudioLines className="h-2.5 w-2.5 text-white" />
            </div>
            Production Music Hub
          </TabBtn>
        </div>
      )}

      <div className="px-4">
        {hub === "music" && isArtist
          ? <MusicHub artistUserId={user.id} />
          : renderGrid()}
      </div>
    </MobileShell>
  );
}

function Grid({ items }: { items: any[] }) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-1">
      {items.map((v) => (
        <a key={v.id} href={v.video_url} target="_blank" rel="noreferrer" className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-900 border border-white/5 transition-opacity hover:opacity-90">
          {v.thumbnail_url
            ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
            : <video src={v.video_url} className="h-full w-full object-cover" muted />}
        </a>
      ))}
    </div>
  );
}

function EmptyTab({ label, cta }: { label: string; cta?: boolean }) {
  return (
    <div className="border border-white/5 bg-neutral-900/30 mb-4 flex flex-col items-center gap-2.5 rounded-2xl p-8 text-center">
      <Film className="h-5 w-5 text-neutral-600" />
      <div className="text-xs font-mono font-bold text-neutral-400 tracking-tight">{label}</div>
      {cta && (
        <Link to="/create" className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-1 rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white shadow-glow">
          Initiate Creation Channel
        </Link>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
        active ? "bg-neutral-950 text-white shadow-md border border-white/5" : "text-neutral-500 hover:text-neutral-400"
      }`}>
      {children}
    </button>
  );
}
