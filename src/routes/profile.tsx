import { DesktopLayout } from "@/components/DesktopLayout";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Play, Upload, Edit2, LogOut, Heart, MessageCircle, Bookmark, Menu,
  Eye, Coins, Users, UserPlus, Search, X, ArrowLeft, FileVideo,
  Repeat2, Share2, Radio, ChevronRight, Grid3X3, Layers, Music2,
  BookmarkCheck, Flame, TrendingUp, Shield, BadgeCheck, Camera,
  Wallet, LayoutDashboard, Music, Mic2, Sparkles, Settings, Plus,
  ChevronDown, ExternalLink, AlertCircle, Gift, Activity, DownloadCloud,
  QrCode, HelpCircle
} from "lucide-react";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const PROFILE_TITLE = "Your Creator Profile · Javan";
const PROFILE_DESC =
  "Manage your Javan creator profile: edit your bio and avatar, review your posts, track viewers and follow your earnings.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: PROFILE_TITLE },
      { name: "description", content: PROFILE_DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: PROFILE_TITLE },
      { property: "og:description", content: PROFILE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/profile" },
      { name: "twitter:title", content: PROFILE_TITLE },
      { name: "twitter:description", content: PROFILE_DESC },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/profile" }],
  }),
  component: ProfilePage,
});

interface UserPost {
  id: string;
  content: string;
  video_url?: string;
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

type ProfileTab = "posts" | "reposts" | "likes" | "saved";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

/* ──────────────────────────────────────────────
   FOLLOWING LIST VIEW (tapped from Following count)
   ────────────────────────────────────────────── */
function FollowingListView({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "recent">("all");

  const { data = [] } = useQuery({
    queryKey: ["my-following", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("follows").select("following_id,created_at")
        .eq("follower_id", user!.id).order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r) => r.following_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,bio,is_verified")
        .in("id", ids);
      return (profs ?? []).map((p) => ({
        ...p,
        followedAt: (rows ?? []).find((r) => r.following_id === p.id)?.created_at,
      }));
    },
  });

  const filtered = data
    .filter((p: any) =>
      p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.handle?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) =>
      filter === "recent"
        ? new Date(b.followedAt ?? 0).getTime() - new Date(a.followedAt ?? 0).getTime()
        : (a.display_name ?? "").localeCompare(b.display_name ?? "")
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#020210] flex flex-col"
    >
      {/* Top bar with back button */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back to profile">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h2 className="font-display text-lg font-black text-chrome flex-1">Following</h2>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              filter === "all" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}
          >A–Z</button>
          <button
            onClick={() => setFilter("recent")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
              filter === "recent" ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            }`}
          >Recent</button>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search following..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder-white/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/50 text-sm">
              {search ? "No matching users found" : "Not following anyone yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 pb-24">
            {filtered.map((p: any) => (
              <Link
                key={p.id}
                to="/u/$handle"
                params={{ handle: p.handle }}
                onClick={onClose}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 active:scale-[0.98] transition-all border border-white/5"
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} className="h-12 w-12 rounded-full object-cover" alt="" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold truncate">{p.display_name}</span>
                    {p.is_verified && <BadgeCheck className="h-4 w-4 text-cyan-400 fill-cyan-400" />}
                  </div>
                  <p className="text-xs text-white/50 truncate">@{p.handle}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   FOLLOWERS LIST VIEW (tapped from Followers count)
   ────────────────────────────────────────────── */
function FollowersListView({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [followedByMe, setFollowedByMe] = useState<Set<string>>(new Set());

  const { data = [] } = useQuery({
    queryKey: ["my-followers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("follows").select("follower_id")
        .eq("following_id", user!.id);
      const ids = (rows ?? []).map((r) => r.follower_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,bio,is_verified")
        .in("id", ids);
      return (profs ?? []).map((p) => ({
        ...p,
        mutual: false,
      }));
    },
  });

  const { data: followingIds = [] } = useQuery({
    queryKey: ["my-following-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("follows").select("following_id").eq("follower_id", user!.id);
      return (rows ?? []).map((r) => r.following_id);
    },
  });

  useEffect(() => {
    setFollowedByMe(new Set(followingIds));
  }, [followingIds]);

  const filtered = data.filter((p: any) =>
    p.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.handle?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFollow = async (userId: string) => {
    if (!user) return;
    const isFollowing = followedByMe.has(userId);
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
        setFollowedByMe((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        toast.success("Unfollowed");
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
        setFollowedByMe((prev) => new Set(prev).add(userId));
        toast.success("Followed back");
      }
    } catch {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#020210] flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back to profile">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h2 className="font-display text-lg font-black text-chrome flex-1">Followers</h2>
        <span className="text-xs text-white/50">{data.length} total</span>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search followers..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder-white/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-white/20 mb-4" />
            <p className="text-white/50 text-sm">{search ? "No matching followers" : "No followers yet"}</p>
          </div>
        ) : (
          <div className="space-y-2 pb-24">
            {filtered.map((p: any) => {
              const isMutual = followedByMe.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all border border-white/5">
                  <Link to="/u/$handle" params={{ handle: p.handle }} className="flex-1 min-w-0 flex items-center gap-3">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} className="h-12 w-12 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold truncate">{p.display_name}</span>
                        {p.is_verified && <BadgeCheck className="h-4 w-4 text-cyan-400 fill-cyan-400" />}
                      </div>
                      <p className="text-xs text-white/50 truncate">@{p.handle}</p>
                      {isMutual && <span className="text-[10px] text-cyan-400 font-bold">Follows you</span>}
                    </div>
                  </Link>
                  {!isMutual && (
                    <button
                      onClick={() => toggleFollow(p.id)}
                      className="px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-[11px] font-bold text-white active:scale-90 transition-all shadow-glow"
                    >
                      Follow Back
                    </button>
                  )}
                  {isMutual && (
                    <span className="text-[11px] text-white/40 font-bold px-3">Following</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   PROFILE PAGE — MAIN COMPONENT
   ────────────────────────────────────────────── */
function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [immersiveViewer, setImmersiveViewer] = useState<string | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const queryClient = useQueryClient();

  const { data: userPosts = [] } = useQuery({
    queryKey: ["user-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data as UserPost[]) ?? [];
    },
  });

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: likedPosts = [] } = useQuery({
    queryKey: ["user-liked-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: likes } = await supabase
        .from("video_likes")
        .select("video_id")
        .eq("user_id", user!.id);
      const videoIds = (likes ?? []).map((l: any) => l.video_id);
      if (!videoIds.length) return [];
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .in("id", videoIds)
        .order("created_at", { ascending: false })
        .limit(30);
      return (posts as UserPost[]) ?? [];
    },
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      queryClient.clear();
      toast.success("Signed out successfully");
      navigate({ to: "/auth" });
    } catch {
      toast.error("Failed to sign out");
    }
  };

  // Hover preview logic
  const handleHoverStart = useCallback((postId: string) => {
    setHoveredPostId(postId);
    const video = videoRefs.current[postId];
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredPostId(null);
    if (hoveredPostId) {
      const video = videoRefs.current[hoveredPostId];
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
  }, [hoveredPostId]);

  const openPost = useCallback((postId: string) => {
    setImmersiveViewer(postId);
  }, []);

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <h2 className="font-display text-xl font-bold">Please sign in to view your profile</h2>
          <Link
            to="/auth"
            className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            Sign in
          </Link>
        </div>
      </MobileShell>
    );
  }

  const currentProfile = profile ?? {
    display_name: user.email?.split("@")[0] ?? "Creator",
    handle: user.email?.split("@")[0] ?? "creator",
    bio: "Welcome to my Javan creator profile!",
    coins: 0,
    earned_coins: 0,
    avatar_url: null,
    cover_url: null,
    is_verified: false,
  };

  const getVisiblePosts = (): UserPost[] => {
    switch (activeTab) {
      case "reposts": return userPosts; // In a real system, would query reposts table
      case "likes": return likedPosts;
      case "saved": return [];
      default: return userPosts;
    }
  };

  const visiblePosts = getVisiblePosts();

  return (
    <>
    <ProfileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

    {/* Following list overlay */}
    <AnimatePresence>
      {showFollowing && (
        <FollowingListView onClose={() => setShowFollowing(false)} />
      )}
    </AnimatePresence>

    {/* Followers list overlay */}
    <AnimatePresence>
      {showFollowers && (
        <FollowersListView onClose={() => setShowFollowers(false)} />
      )}
    </AnimatePresence>

    {/* Immersive Video Viewer */}
    <AnimatePresence>
      {immersiveViewer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black"
        >
          <div className="relative h-full w-full">
            <button
              onClick={() => setImmersiveViewer(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 active:scale-90 transition-all"
              aria-label="Close viewer"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            {(() => {
              const post = [...userPosts, ...likedPosts].find((p) => p.id === immersiveViewer);
              return post?.video_url ? (
                <video
                  src={post.video_url}
                  autoPlay
                  loop
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <FileVideo className="h-16 w-16 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50">Video preview</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ─── DESKTOP LAYOUT ─── */}
    <DesktopLayout>
      <div className="max-w-5xl mx-auto py-10 relative">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="absolute top-10 right-0 z-20 flex h-12 w-12 items-center justify-center rounded-2xl glass border border-white/20 bg-black/40 hover:bg-black/60 active:scale-95 transition-all shadow-glow"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>

        {/* Immersive 3D Banner */}
        <div className="relative h-52 rounded-3xl overflow-hidden shadow-glow mb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-rose-600 opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.15),transparent_70%)]" />
          <div className="absolute inset-0 backdrop-blur-[0px]" />
          {/* Decorative glow orbs */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-16 left-10 h-36 w-36 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 border-4 border-[#020210] shadow-[0_0_40px_rgba(255,0,128,0.4)] z-10" />
        </div>

        {/* Profile Info */}
        <div className="px-8 flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-3xl font-black text-chrome">{currentProfile.display_name}</h2>
              {currentProfile.is_verified && (
                <BadgeCheck className="h-6 w-6 text-cyan-400 fill-cyan-400" />
              )}
            </div>
            <p className="text-base text-white/50">@{currentProfile.handle}</p>
            {currentProfile.bio && <p className="text-sm text-white/80 mt-3 max-w-xl leading-relaxed">{currentProfile.bio}</p>}
          </div>
          <div className="flex gap-3">
            <Link to="/profile/edit">
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition-all active:scale-95">
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-600/30 transition-all active:scale-95">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Core Metrics Bar — Following | Followers | Balance */}
        <div className="px-8 mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setShowFollowing(true)}
              className="flex-1 flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.97] transition-all group"
            >
              <p className="text-2xl font-black text-cyan-400 group-hover:drop-shadow-[0_0_10px_rgba(0,212,255,0.5)] transition-all">{formatCount(followingCount)}</p>
              <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1">Following</p>
            </button>
            <button
              onClick={() => setShowFollowers(true)}
              className="flex-1 flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.97] transition-all group"
            >
              <p className="text-2xl font-black text-emerald-400 group-hover:drop-shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all">{formatCount(followerCount)}</p>
              <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1">Followers</p>
            </button>
            <Link
              to="/wallet"
              className="flex-1 flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-amber-500/20 hover:bg-amber-500/10 active:scale-[0.97] transition-all group"
            >
              <p className="text-2xl font-black text-amber-400 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all">
                ${((currentProfile.coins ?? 0) / 100).toFixed(2)}
              </p>
              <p className="text-[11px] text-white/50 uppercase tracking-widest mt-1 flex items-center gap-1">
                <Coins className="h-3 w-3" /> Balance
              </p>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 flex gap-3 mb-8">
          <Link
            to="/profile/edit"
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/20 py-3 text-sm font-bold hover:bg-white/20 active:scale-95 transition-all"
          >
            <Edit2 className="h-4 w-4" /> Edit Profile
          </Link>
          <Link
            to="/create"
            search={{ mode: undefined }}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-orange-500 py-3 text-sm font-bold text-white hover:from-fuchsia-500 hover:to-rose-500 active:scale-95 transition-all shadow-glow"
          >
            <Plus className="h-4 w-4" /> Create
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 border-b border-white/5 mb-6">
          <div className="flex gap-1">
            {[
              { key: "posts" as const, label: "Posts", icon: FileVideo },
              { key: "reposts" as const, label: "Reposts", icon: Repeat2 },
              { key: "likes" as const, label: "Likes", icon: Heart },
              { key: "saved" as const, label: "Saved", icon: Bookmark },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all active:scale-95 ${
                  activeTab === key
                    ? "text-white border-cyan-400 shadow-[0_4px_10px_-4px_rgba(0,212,255,0.5)]"
                    : "text-white/40 border-transparent hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Video Grid */}
        <div className="px-8 grid grid-cols-3 gap-4 pb-20">
          {activeTab === "saved" ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-white/5">
              <Bookmark className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/40">Save posts to find them here later.</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-white/5">
              <Upload className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/40">
                {activeTab === "posts" ? "No posts yet. Create your first post!" :
                 activeTab === "reposts" ? "No reposts yet. Share content from other creators!" :
                 "No liked posts yet."}
              </p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-400/50 transition-all duration-300"
                onMouseEnter={() => handleHoverStart(post.id)}
                onMouseLeave={handleHoverEnd}
                onClick={() => openPost(post.id)}
              >
                {post.video_url ? (
                  <video
                    ref={(el) => { videoRefs.current[post.id] = el; }}
                    src={post.video_url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-rose-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <FileVideo className="h-10 w-10 text-white/20" />
                  </div>
                )}
                {/* Hover overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-200 ${
                  hoveredPostId === post.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`p-3 rounded-full bg-white/20 backdrop-blur-md transition-transform duration-200 ${
                      hoveredPostId === post.id ? "scale-110" : "scale-100"
                    }`}>
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  {/* View count overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] text-white/90 font-bold">
                    <Eye className="h-3 w-3" /> {formatCount(post.views_count)}
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[11px] text-white/70">
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {formatCount(post.likes_count)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DesktopLayout>

    {/* ─── MOBILE LAYOUT ─── */}
    <MobileShell immersive>
      <div className="pb-20 relative">
        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full glass border border-white/20 bg-black/40 hover:bg-black/60 active:scale-95 transition-all shadow-glow"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        {/* 3D Depth Banner */}
        <div className="relative h-40 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-700 to-rose-600" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.12),transparent_70%)]" />
          {/* Floating orbs */}
          <div className="absolute top-4 left-8 w-20 h-20 rounded-full bg-cyan-400/10 blur-2xl animate-pulse" />
          <div className="absolute bottom-2 right-12 w-16 h-16 rounded-full bg-fuchsia-400/10 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
          {/* Avatar frame with neon pulse */}
          <div className="absolute -bottom-10 left-4">
            <div className="relative">
              <div className="absolute inset-[-4px] rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-rose-500 animate-spin" style={{ animationDuration: "3s" }} />
              <div className="relative h-[72px] w-[72px] rounded-full bg-[#020210] flex items-center justify-center">
                {currentProfile.avatar_url ? (
                  <img src={currentProfile.avatar_url} className="h-[68px] w-[68px] rounded-full object-cover" alt="avatar" />
                ) : (
                  <div className="h-[68px] w-[68px] rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 flex items-center justify-center">
                    <span className="text-xl font-black text-white">{currentProfile.display_name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 pt-14 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-black" role="heading" aria-level={1}>{currentProfile.display_name}</h1>
                {currentProfile.is_verified && <BadgeCheck className="h-4 w-4 text-cyan-400 fill-cyan-400" />}
              </div>
              <p className="text-sm text-white/50">@{currentProfile.handle}</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/20 active:scale-90 transition-all"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>

          {/* Bio */}
          {currentProfile.bio && <p className="text-sm text-white/80 mb-4 leading-relaxed line-clamp-2">{currentProfile.bio}</p>}

          {/* Core Metrics Bar — Following | Followers | Balance */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => setShowFollowing(true)}
              className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.95] transition-all"
            >
              <p className="text-base font-black text-cyan-400">{formatCount(followingCount)}</p>
              <p className="text-[10px] text-white/50 uppercase mt-0.5">Following</p>
            </button>
            <button
              onClick={() => setShowFollowers(true)}
              className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.95] transition-all"
            >
              <p className="text-base font-black text-emerald-400">{formatCount(followerCount)}</p>
              <p className="text-[10px] text-white/50 uppercase mt-0.5">Followers</p>
            </button>
            <Link
              to="/wallet"
              className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-amber-500/20 hover:bg-amber-500/10 active:scale-[0.95] transition-all"
            >
              <p className="text-base font-black text-amber-400">${((currentProfile.coins ?? 0) / 100).toFixed(2)}</p>
              <p className="text-[10px] text-white/50 uppercase mt-0.5 flex items-center gap-0.5">
                <Coins className="h-2.5 w-2.5" /> Balance
              </p>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Link
              to="/profile/edit"
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/20 py-2.5 text-xs font-bold hover:bg-white/20 active:scale-95 transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </Link>
            <Link
              to="/create"
              search={{ mode: undefined }}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-orange-500 py-2.5 text-xs font-bold text-white hover:from-fuchsia-500 hover:to-rose-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,0,128,0.3)]"
            >
              <Plus className="h-3.5 w-3.5" /> Create
            </Link>
          </div>
        </div>

        {/* Tab Navigation — 4 Tabs */}
        <div className="border-t border-white/5">
          <div role="tablist" aria-label="Profile content" className="flex items-center gap-0 px-4">
            {[
              { key: "posts" as const, label: "Posts", icon: FileVideo },
              { key: "reposts" as const, label: "Reposts", icon: Repeat2 },
              { key: "likes" as const, label: "Likes", icon: Heart },
              { key: "saved" as const, label: "Saved", icon: Bookmark },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 border-b-2 transition-all active:scale-95 ${
                  activeTab === key
                    ? "text-white border-cyan-400"
                    : "text-white/40 border-transparent hover:text-white/70"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Video Grid Matrix */}
        <div className="px-1 pt-3 pb-4 grid grid-cols-3 gap-[2px]">
          {activeTab === "saved" ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
              <Bookmark className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-sm text-white/50">Save posts to find them here later.</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
              <Upload className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-sm text-white/50">
                {activeTab === "posts" ? "No posts yet. Create your first post!" :
                 activeTab === "reposts" ? "No reposts yet. Share content!" :
                 "No liked posts yet."}
              </p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer"
                onTouchStart={() => handleHoverStart(post.id)}
                onTouchEnd={handleHoverEnd}
                onClick={() => openPost(post.id)}
              >
                {post.video_url ? (
                  <video
                    ref={(el) => { videoRefs.current[post.id] = el; }}
                    src={post.video_url}
                    className="h-full w-full object-cover"
                    muted
                    loop
                    playsInline
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-rose-500/20 to-fuchsia-500/20" />
                )}
                {/* View count overlay at bottom-left */}
                <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[9px] text-white/90 font-bold bg-black/40 rounded px-1 py-0.5">
                  <Eye className="h-2.5 w-2.5" /> {formatCount(post.views_count)}
                </div>
                {/* 3D micro-scale on active */}
                <AnimatePresence>
                  {hoveredPostId === post.id && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1.05, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="p-2 rounded-full bg-black/50 backdrop-blur-md">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileShell>
    </>
  );
}
