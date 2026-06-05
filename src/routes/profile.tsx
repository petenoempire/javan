import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { MusicHub } from "@/components/MusicHub";
import { supabase } from "@/integrations/supabase/client";
import {
  Share2, Wallet, BadgeCheck, LogOut, Pencil, Link as LinkIcon, MapPin, Film, Menu,
  AudioLines, Eye, Plus, ChevronDown, Lock, Repeat2, Bookmark, Heart, LayoutGrid,
  X, Type, Folder, Calendar, Sparkles, Camera,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Boogle" }] }),
  component: Profile,
});

type FeedTab = "posts" | "private" | "reposts" | "bookmarks" | "liked";

function Profile() {
  const { profile, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isProfileIndex = pathname === "/profile";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);
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

  if (loading) return <MobileShell><div className="px-5 pt-10 text-sm text-muted-foreground">Loading…</div></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-primary mb-4 h-16 w-16 rounded-full shadow-glow" />
          <h2 className="font-display text-2xl font-bold">Join Boogle</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to upload videos, send messages, and follow creators.</p>
          <Link to="/auth" className="bg-gradient-primary mt-6 rounded-full px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            Sign in / Create account
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
      return liked.length === 0 ? <EmptyTab label="No liked videos yet" /> : <Grid items={liked} />;
    }
    if (feedTab === "posts") {
      return !stats || stats.videos.length === 0
        ? <EmptyTab label="No videos yet" cta />
        : <Grid items={stats.videos} />;
    }
    const map: Record<FeedTab, string> = {
      posts: "", liked: "",
      private: "No private posts yet — long-press a post to lock it.",
      reposts: "Reposts you boost will collect here.",
      bookmarks: "Save posts you love — they'll appear here.",
    };
    return <EmptyTab label={map[feedTab]} />;
  };

  return (
    <MobileShell>
      <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <StoryComposer open={storyOpen} onClose={() => setStoryOpen(false)} />

      <div className="relative">
        {profile?.cover_url
          ? <img src={profile.cover_url} className="h-40 w-full object-cover" alt="" />
          : <div className="bg-gradient-primary h-40 w-full opacity-80" />}

        {/* Hamburger menu, top-left of banner */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="glass absolute left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-elegant active:scale-90"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="px-5 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            {/* Avatar + story-creation badge */}
            <div className="relative rounded-full bg-gradient-primary p-0.5 shadow-glow">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-elegant" alt="" />
                : <div className="bg-gradient-primary h-24 w-24 rounded-full border-4 border-background shadow-elegant" />}
              <button
                onClick={() => setStoryOpen(true)}
                aria-label="Create a story"
                className="bg-gradient-primary absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-background shadow-glow active:scale-90"
              >
                <Plus className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigator.share?.({ url: location.href, title: `@${profile?.handle} on Boogle` }).catch(() => {})}
                className="glass rounded-full p-2"><Share2 className="h-4 w-4" /></button>
              <button onClick={() => signOut().then(() => navigate({ to: "/auth" }))} className="glass rounded-full p-2">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold leading-tight">{profile?.display_name || `@${profile?.handle}`}</h1>
            {profile?.is_verified && <BadgeCheck className="h-5 w-5 fill-accent text-background" />}
          </div>
          <div className="text-base font-semibold text-muted-foreground">@{profile?.handle}</div>
          {profile?.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {profile?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
            {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent"><LinkIcon className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, "")}</a>}
          </div>

          {/* Stats grid — Following / Followers clickable; Viewers replaces Coins */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Link to="/following" className="glass rounded-2xl p-3 transition active:scale-95">
              <div className="font-display text-lg font-bold">{(stats?.following ?? 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</div>
            </Link>
            <Link to="/followers" className="glass rounded-2xl p-3 transition active:scale-95">
              <div className="font-display text-lg font-bold">{(stats?.followers ?? 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</div>
            </Link>
            <button
              type="button"
              onClick={() => navigate({ to: "/profile/viewers" })}
              className="glass relative overflow-hidden rounded-2xl p-3 text-center transition active:scale-95"
            >
              <div className="bg-gradient-primary absolute -right-4 -top-4 h-12 w-12 rounded-full opacity-20 blur-md" />
              <div className="relative flex items-center justify-center gap-1">
                <Eye className="h-4 w-4 text-primary" />
                <div className="font-display text-lg font-bold">{(stats?.viewers ?? 0).toLocaleString()}</div>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Viewers</div>
            </button>
          </div>

          {/* Edit + Wallet */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => navigate({ to: "/profile/edit" })} className="bg-gradient-primary flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold text-primary-foreground shadow-glow active:scale-[0.98]">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
            <Link to="/wallet" className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold">
              <Wallet className="h-3.5 w-3.5" /> Wallet
            </Link>
          </div>

          {/* Content feed tabs */}
          <div className="mt-5 flex items-center justify-around border-y border-border/40 py-2">
            {feedTabs.map(({ key, Icon, arrow }) => {
              const active = feedTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setFeedTab(key)}
                  aria-label={key}
                  className={`relative flex items-center gap-0.5 px-3 py-1.5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  {arrow && <ChevronDown className="h-3 w-3" />}
                  {active && <span className="bg-gradient-primary absolute -bottom-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Music Hub toggle for artists */}
      {isArtist && (
        <div className="mx-5 mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-muted/40 p-1">
          <TabBtn active={hub === "videos"} onClick={() => setHub("videos")}><Film className="h-4 w-4" /> Videos</TabBtn>
          <TabBtn active={hub === "music"} onClick={() => setHub("music")}>
            <div className="bg-gradient-primary flex h-4 w-4 items-center justify-center rounded-full">
              <AudioLines className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            Music Hub
          </TabBtn>
        </div>
      )}

      <div className="px-5">
        {hub === "music" && isArtist
          ? <MusicHub artistUserId={user.id} />
          : renderGrid()}
      </div>
    </MobileShell>
  );
}

function Grid({ items }: { items: any[] }) {
  return (
    <div className="mb-3 grid grid-cols-3 gap-1">
      {items.map((v) => (
        <a key={v.id} href={v.video_url} target="_blank" rel="noreferrer" className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
          {v.thumbnail_url
            ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
            : <video src={v.video_url} className="h-full w-full object-cover" muted />}
        </a>
      ))}
    </div>
  );
}

function StoryComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const chips = [
    { label: "Text", Icon: Type },
    { label: "Drafts", Icon: Folder },
    { label: "Archive", Icon: Calendar },
    { label: "Flip Story", Icon: Sparkles },
  ];
  const tabs = ["All", "Favorites", "Photos", "Videos"];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] mx-auto max-w-[480px] bg-black text-white animate-in slide-in-from-bottom-6 duration-200">
      <header className="flex items-center justify-center px-4 pb-4 pt-16">
        <button onClick={onClose} aria-label="Close story composer" className="absolute left-4 top-14 p-2 active:scale-90">
          <X className="h-8 w-8" />
        </button>
        <h2 className="font-display text-2xl font-bold">Add to Story</h2>
      </header>

      <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 py-3">
        {chips.map(({ label, Icon }) => (
          <button key={label} className="flex h-28 min-w-[128px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 shadow-inner active:scale-95">
            {label === "Text" ? <span className="font-display text-4xl font-bold">Aa</span> : <Icon className="h-9 w-9" />}
            <span className="text-base font-semibold">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between px-5">
        <button className="flex items-center gap-1 font-display text-2xl font-bold">Recents <ChevronDown className="h-5 w-5" /></button>
        <button className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-base font-semibold">
          <span className="h-5 w-5 rounded-full border-2 border-white" /> Select multiple
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 border-b border-white/10 px-5 text-center text-base font-bold text-white/50">
        {tabs.map((tab, index) => (
          <button key={tab} className={`relative pb-3 ${index === 0 ? "text-white" : ""}`}>
            {tab}
            {index === 0 && <span className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-white" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-0 overflow-hidden">
        <button className="flex aspect-[3/4] items-center justify-center bg-zinc-900 active:opacity-80" aria-label="Open camera">
          <Camera className="h-12 w-12" />
        </button>
        {Array.from({ length: 11 }).map((_, i) => (
          <button key={i} className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-fuchsia-600 via-cyan-400 to-black active:opacity-80">
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute bottom-2 left-2 h-10 w-10 rounded-full bg-black/50" />
            <div className="absolute right-2 top-2 h-5 w-5 rounded-full bg-primary/80" />
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyTab({ label, cta }: { label: string; cta?: boolean }) {
  return (
    <div className="glass mb-3 flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
      <Film className="h-7 w-7 text-primary" />
      <div className="font-display font-semibold">{label}</div>
      {cta && (
        <Link to="/create" className="bg-gradient-primary mt-1 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow">Upload your first</Link>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
        active ? "bg-background text-foreground shadow-elegant" : "text-muted-foreground"
      }`}>
      {children}
    </button>
  );
}
