import React from "react";
import { DesktopLayout } from "@/components/DesktopLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import {
  Play, Heart, Menu, Eye, Coins, Users, UserPlus, Search,
  ArrowLeft, FileVideo, BookmarkCheck, BadgeCheck, Pencil,
  UserRoundCheck, Gift, Activity, HelpCircle, Settings, Wallet,
  Radio, Layers, Music2, Repeat2, Share2, Grid3x3, Home, Plus, Mail
} from "lucide-react";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PROFILE_TITLE = "Your Creator Profile · Javan";
const PROFILE_DESC = "Manage your Javan creator profile: edit your bio and avatar, review your posts, track viewers and follow your earnings.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: PROFILE_TITLE },
      { name: "description", content: PROFILE_DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: PROFILE_TITLE },
      { property: "og:description", content: PROFILE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/profile" },
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
  image_url?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

type ProfileTab = "following" | "reposts" | "likes" | "saved";

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

/* ──────────────────────────────────────────────
   FOLLOWING LIST VIEW
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
      const ids = (rows ?? []).map((r: any) => r.following_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,bio,is_verified")
        .in("id", ids);
      const profileMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (rows ?? []).map((r: any) => ({ ...r, profile: profileMap.get(r.following_id) })).filter((r: any) => r.profile);
    },
  });

  const filtered = data.filter((d: any) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (d.profile?.handle ?? "").toLowerCase().includes(q) || (d.profile?.display_name ?? "").toLowerCase().includes(q);
  });

  const displayed = filter === "recent" ? filtered.slice(0, 20) : filtered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="font-display text-lg font-black text-chrome flex-1">Following</h1>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
          />
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${filter === "all" ? "bg-white/15 text-white" : "bg-white/5 text-white/40"}`}>All ({filtered.length})</button>
          <button onClick={() => setFilter("recent")} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${filter === "recent" ? "bg-white/15 text-white" : "bg-white/5 text-white/40"}`}>Recent</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {displayed.length > 0 ? (
          <ul className="space-y-1">
            {displayed.map((row: any) => (
              <li key={row.following_id}>
                <Link to="/u/$handle" params={{ handle: row.profile.handle }} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-white/5 transition-colors">
                  <Avatar className="h-11 w-11 border border-white/10">
                    <AvatarImage src={row.profile.avatar_url} />
                    <AvatarFallback>{row.profile.display_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 truncate text-sm font-bold">
                      @{row.profile.handle}
                      {row.profile.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-400 fill-cyan-400/20" />}
                    </div>
                    <div className="truncate text-xs text-white/40">{row.profile.display_name}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-white/40 text-sm">{search ? "No results found" : "You're not following anyone yet"}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   FOLLOWERS LIST VIEW
   ────────────────────────────────────────────── */
function FollowersListView({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["my-followers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("follows").select("follower_id,created_at")
        .eq("following_id", user!.id).order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r: any) => r.follower_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,bio,is_verified")
        .in("id", ids);
      const profileMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (rows ?? []).map((r: any) => ({ ...r, profile: profileMap.get(r.follower_id) })).filter((r: any) => r.profile);
    },
  });

  const filtered = data.filter((d: any) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (d.profile?.handle ?? "").toLowerCase().includes(q) || (d.profile?.display_name ?? "").toLowerCase().includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="font-display text-lg font-black text-chrome flex-1">Followers</h1>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search followers..." className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {filtered.length > 0 ? (
          <ul className="space-y-1">
            {filtered.map((row: any) => (
              <li key={row.follower_id}>
                <Link to="/u/$handle" params={{ handle: row.profile.handle }} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-white/5 transition-colors">
                  <Avatar className="h-11 w-11 border border-white/10">
                    <AvatarImage src={row.profile.avatar_url} />
                    <AvatarFallback>{row.profile.display_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 truncate text-sm font-bold">
                      @{row.profile.handle}
                      {row.profile.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-400 fill-cyan-400/20" />}
                    </div>
                    <div className="truncate text-xs text-white/40">{row.profile.display_name}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserPlus className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-white/40 text-sm">{search ? "No results found" : "No followers yet"}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   VIEWERS TRACKING PANEL (30 days)
   ────────────────────────────────────────────── */
function ViewersPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

  const { data = [], isLoading } = useQuery({
    queryKey: ["profile-viewers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
      const { data: rows, error } = await supabase
        .from("profile_views")
        .select("viewer_id,viewed_at")
        .eq("profile_id", user!.id)
        .gte("viewed_at", thirtyDaysAgo)
        .order("viewed_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const ids = (rows ?? []).map((row: any) => row.viewer_id);
      if (!ids.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,bio,is_verified")
        .in("id", ids);
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return (rows ?? []).map((row: any) => ({ ...row, profile: profileMap.get(row.viewer_id) })).filter((r: any) => r.profile);
    },
  });

  function formatVisit(value: string) {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(1, Math.floor(diff / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-black text-chrome">Viewers</h1>
          <p className="text-[10px] text-white/40">Last 30 days</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 flex h-10 w-10 items-center justify-center rounded-full">
          <Eye className="h-5 w-5 text-cyan-400" />
        </div>
      </div>

      <div className="flex gap-3 px-4 py-3 border-b border-white/5">
        <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-3 text-center">
          <div className="text-lg font-black text-white">{data.length}</div>
          <div className="text-[10px] text-white/40 font-bold uppercase">Views</div>
        </div>
        <div className="flex-1 rounded-xl bg-white/5 border border-white/5 p-3 text-center">
          <div className="text-lg font-black text-white">{new Set(data.map((d: any) => d.viewer_id)).size}</div>
          <div className="text-[10px] text-white/40 font-bold uppercase">Unique</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {isLoading ? (
          <div className="py-10 text-center text-sm text-white/30">Loading viewers...</div>
        ) : data.length > 0 ? (
          <ul className="space-y-1 mt-3">
            {data.map((row: any) => (
              <li key={`${row.viewer_id}-${row.viewed_at}`}>
                <Link to="/u/$handle" params={{ handle: row.profile.handle }} onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-white/5 transition-colors">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={row.profile.avatar_url} />
                    <AvatarFallback>{row.profile.display_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 truncate text-sm font-bold">
                      @{row.profile.handle}
                      {row.profile.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-cyan-400 fill-cyan-400/20" />}
                    </div>
                    <div className="truncate text-xs text-white/40">{row.profile.display_name}</div>
                  </div>
                  <span className="text-[10px] text-white/30 font-mono">{formatVisit(row.viewed_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserRoundCheck className="h-10 w-10 text-white/20 mb-3" />
            <p className="text-white/40 text-sm">No profile visits in the last 30 days</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   MAIN PROFILE PAGE
   ────────────────────────────────────────────── */
function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("following");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showViewers, setShowViewers] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: posts = [] } = useQuery<UserPost[]>({
    queryKey: ["my-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as UserPost[];
    },
  });

  const { data: followingPosts = [] } = useQuery<UserPost[]>({
    queryKey: ["my-following-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);
      if (followsError) throw followsError;
      const ids = (follows ?? []).map((row: any) => row.following_id).filter(Boolean);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as UserPost[];
    },
  });

  const { data: likedPosts = [] } = useQuery<string[]>({
    queryKey: ["my-liked", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("video_likes")
        .select("video_id")
        .eq("user_id", user!.id)
        .limit(50);
      return (data ?? []).map((d: any) => d.video_id);
    },
  });

  const { data: savedPosts = [] } = useQuery<string[]>({
    queryKey: ["my-saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("post_id")
        .eq("user_id", user!.id)
        .limit(50);
      return (data ?? []).map((d: any) => d.post_id);
    },
  });

  const { data: followStats } = useQuery({
    queryKey: ["follow-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [following, followers] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user!.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user!.id),
      ]);
      return { following: following.count ?? 0, followers: followers.count ?? 0 };
    },
  });

  const renderTabContent = () => {
    let visiblePosts: UserPost[] = [];
    switch (tab) {
      case "following": visiblePosts = followingPosts; break;
      case "likes": visiblePosts = posts.filter((p) => likedPosts.includes(p.id)); break;
      case "saved": visiblePosts = posts.filter((p) => savedPosts.includes(p.id)); break;
      case "reposts": visiblePosts = posts.filter((p) => p.content?.startsWith("RT:")); break;
    }

    if (visiblePosts.length === 0) {
      const labels: Record<ProfileTab, string> = { following: "followed posts", likes: "liked posts", saved: "saved posts", reposts: "reposts" };
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileVideo className="h-12 w-12 text-white/15 mb-3" />
          <p className="text-white/30 text-sm">No {labels[tab]} yet.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-3 gap-[2px]">
        {visiblePosts.map((post) => (
          <Link key={post.id} to="/posts/$id" params={{ id: post.id }} className="relative aspect-[9/16] bg-black/40 overflow-hidden group">
            {post.image_url || post.thumbnail_url ? (
              <img src={post.image_url || post.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-black flex items-center justify-center">
                <FileVideo className="h-6 w-6 text-white/15" />
              </div>
            )}
            <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[9px] font-bold text-white/80 bg-black/50 rounded px-1 py-0.5">
              <Play className="h-2.5 w-2.5" /> {formatCount(post.views_count)}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile View */}
      <div className="lg:hidden fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
        {/* Immersive Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-fuchsia-500/5 blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex-1">
            <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">@{profile?.handle || "user"}</p>
          </div>
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Open menu">
            <Menu className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Avatar + Info */}
        <div className="relative z-10 flex items-center gap-4 px-4 py-5">
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500 via-fuchsia-500 to-amber-400 p-[3px] shadow-[0_0_20px_rgba(0,212,255,0.4),0_0_40px_rgba(168,85,247,0.2)]">
              <div className="h-full w-full rounded-full bg-[#020210] p-[2px]">
                <Avatar className="h-full w-full">
                  <AvatarImage src={profile?.avatar_url || undefined} className="rounded-full" />
                  <AvatarFallback className="text-xl font-black bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-white">
                    {profile?.display_name?.[0] || profile?.handle?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            {profile?.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 shadow-[0_0_10px_rgba(0,212,255,0.5)]">
                <BadgeCheck className="h-4 w-4 text-white fill-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black truncate">{profile?.display_name || "Creator"}</h2>
            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{profile?.bio || "No bio yet"}</p>
          </div>
        </div>

        {/* Core Metrics: Following, Followers, Balance */}
        <div className="relative z-10 flex gap-2 px-4 mb-4">
          <button onClick={() => setShowFollowing(true)} className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-center active:scale-95 transition-all">
            <div className="text-base font-black text-white">{formatCount(followStats?.following ?? 0)}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Following</div>
          </button>
          <button onClick={() => setShowFollowers(true)} className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3 text-center active:scale-95 transition-all">
            <div className="text-base font-black text-white">{formatCount(followStats?.followers ?? 0)}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Followers</div>
          </button>
          <button onClick={() => navigate({ to: "/wallet" })} className="flex-1 rounded-xl bg-white/5 border border-cyan-500/20 p-3 text-center active:scale-95 transition-all">
            <div className="flex items-center justify-center gap-1">
              <Coins className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-base font-black text-white">{formatCount(profile?.earned_coins ?? 0)}</span>
            </div>
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Balance</div>
          </button>
        </div>

        {/* Action Buttons: Edit Profile + Viewers */}
        <div className="relative z-10 flex gap-3 px-4 mb-5">
          <button onClick={() => navigate({ to: "/profile/edit" })} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/20 py-3 text-sm font-bold text-white active:scale-95 transition-all shadow-[0_0_15px_rgba(0,212,255,0.15)]">
            <Pencil className="h-4 w-4" /> Edit Profile
          </button>
          <button onClick={() => setShowViewers(true)} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-amber-500/20 border border-fuchsia-500/20 py-3 text-sm font-bold text-white active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Eye className="h-4 w-4" /> Viewers
          </button>
        </div>

        {/* TikTok-style Icon Tab Switcher */}
        <div className="relative z-10 flex border-b border-white/5">
          {(["following", "saved", "reposts", "likes"] as ProfileTab[]).map((t) => {
            const iconMap: Record<ProfileTab, React.ComponentType<{ className?: string }>> = {
              following: Grid3x3,
              saved: BookmarkCheck,
              reposts: Repeat2,
              likes: Heart,
            };
            const Icon = iconMap[t];
            return (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 flex items-center justify-center transition-all relative ${tab === t ? "text-white" : "text-white/30"}`}>
                <Icon className={`h-5 w-5 transition-all ${tab === t ? "drop-shadow-[0_0_6px_rgba(0,212,255,0.6)]" : ""}`} />
                {tab === t && <motion.div layoutId="profileTabIndicator" className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-white rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="relative z-10 flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Persistent primary navigation */}
        <nav className="fixed inset-x-0 bottom-0 z-[70] flex items-center justify-center px-3 pb-[env(safe-area-inset-bottom)]">
          <div className="flex h-11 w-full max-w-[320px] items-center justify-around rounded-2xl border border-cyan-300/35 bg-[#07071e]/90 px-1.5 backdrop-blur-2xl shadow-[0_8px_26px_rgba(0,0,0,0.55),0_0_24px_rgba(0,212,255,0.16)]">
            <Link to="/" aria-label="Home" className="flex flex-col items-center gap-0.5 text-white/50 active:scale-90"><Home className="h-5 w-5" /><span className="text-[8px]">Home</span></Link>
            <Link to="/friends" aria-label="Friends" className="flex flex-col items-center gap-0.5 text-white/50 active:scale-90"><Users className="h-5 w-5" /><span className="text-[8px]">Friends</span></Link>
            <Link to="/create" search={{ mode: "live" }} aria-label="Create" className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-600 to-cyan-400 shadow-[0_0_18px_rgba(255,0,128,0.42)] active:scale-90"><Plus className="h-5 w-5 text-white" /></Link>
            <Link to="/inbox" aria-label="Inbox" className="flex flex-col items-center gap-0.5 text-white/50 active:scale-90"><Mail className="h-5 w-5" /><span className="text-[8px]">Inbox</span></Link>
            <Link to="/profile" aria-label="Profile" className="flex flex-col items-center gap-0.5 text-fuchsia-300 active:scale-90"><UserRoundCheck className="h-5 w-5" /><span className="text-[8px]">Profile</span></Link>
          </div>
        </nav>

        {/* Drawer */}
        <ProfileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Overlays */}
        <AnimatePresence>
          {showFollowing && <FollowingListView onClose={() => setShowFollowing(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {showFollowers && <FollowersListView onClose={() => setShowFollowers(false)} />}
        </AnimatePresence>
        <AnimatePresence>
          {showViewers && <ViewersPanel onClose={() => setShowViewers(false)} />}
        </AnimatePresence>
      </div>
    </>
  );
}
