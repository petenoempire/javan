import { DesktopLayout } from "@/components/DesktopLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Play, Upload, Edit2, LogOut, Heart, MessageCircle, Bookmark, Menu } from "lucide-react";
import { ProfileDrawer } from "@/components/ProfileDrawer";
import { toast } from "sonner";

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
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
}

type ProfileTab = "posts" | "likes" | "saved";

function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: userPosts = [] } = useQuery({
    queryKey: ["user-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(12);
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

  const queryClient = useQueryClient();

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
  };

  const visiblePosts = activeTab === "likes" ? [] : userPosts;

  return (
    <>
    <ProfileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    <DesktopLayout>
      <div className="max-w-4xl mx-auto py-10 relative">
        {/* Top-Right Hamburger Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="absolute top-10 right-0 z-20 flex h-12 w-12 items-center justify-center rounded-2xl glass border border-white/20 bg-black/40 hover:bg-black/60 active:scale-95 transition-all shadow-glow"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>

        {/* Header */}
        <div className="relative h-48 rounded-3xl overflow-hidden bg-gradient-to-r from-fuchsia-600 to-rose-600 shadow-glow mb-16">
          <div className="absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 border-4 border-[#020210] shadow-glow" />
        </div>

        {/* Profile Info */}
        <div className="px-8 flex items-start justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl font-black text-chrome">{currentProfile.display_name}</h2>
            <p className="text-lg text-white/50">@{currentProfile.handle}</p>
            {currentProfile.bio && <p className="text-base text-white/80 mt-4 max-w-xl leading-relaxed">{currentProfile.bio}</p>}
          </div>
          <div className="flex gap-3">
            <Link to="/profile/edit">
              <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition-all">
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            </Link>
            <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl bg-rose-600/20 border border-rose-500/30 px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-600/30 transition-all">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 px-8 mb-12">
          <div className="glass p-6 rounded-3xl border border-white/5 text-center">
            <p className="text-3xl font-black text-emerald-400">{userPosts.length}</p>
            <p className="text-xs text-white/40 uppercase mt-2 tracking-widest">Posts</p>
          </div>
          <div className="glass p-6 rounded-3xl border border-white/5 text-center">
            <p className="text-3xl font-black text-cyan-400">{followerCount}</p>
            <p className="text-xs text-white/40 uppercase mt-2 tracking-widest">Followers</p>
          </div>
          <div className="glass p-6 rounded-3xl border border-white/5 text-center">
            <p className="text-3xl font-black text-amber-400">${(currentProfile.coins / 100).toFixed(2)}</p>
            <p className="text-xs text-white/40 uppercase mt-2 tracking-widest">Balance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b border-white/5 mb-8">
          <div className="flex gap-8">
            {(["posts", "likes", "saved"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === tab ? "text-white border-cyan-400 shadow-[0_4px_10px_-4px_rgba(0,212,255,0.5)]" : "text-white/40 border-transparent hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="px-8 grid grid-cols-3 gap-4 pb-20">
          {activeTab === "saved" ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-white/5">
              <Bookmark className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/40">Saved posts coming soon.</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center glass rounded-3xl border border-white/5">
              <Upload className="h-12 w-12 text-white/10 mb-4" />
              <p className="text-white/40">No content found in this section.</p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <Link
                key={post.id}
                to="/posts/$id"
                params={{ id: post.id }}
                className="group relative aspect-square rounded-2xl glass border border-white/10 overflow-hidden cursor-pointer"
              >
                {post.video_url && <video src={post.video_url} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Play className="h-10 w-10 text-white drop-shadow-lg" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </DesktopLayout>
    <MobileShell>
      <div className="pb-20 relative">
        {/* Top-Right Hamburger Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full glass border border-white/20 bg-black/40 hover:bg-black/60 active:scale-95 transition-all shadow-glow"
        >
          <Menu className="h-5 w-5 text-white" />
        </button>

        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-fuchsia-600 to-rose-600">
          <div className="absolute -bottom-10 left-4 h-20 w-20 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 border-4 border-black" />
        </div>

        {/* Profile Info */}
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-black" role="heading" aria-level={1}>{currentProfile.display_name}</h1>
              <p className="text-sm text-white/50">@{currentProfile.handle}</p>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-3 py-2 text-xs font-bold hover:bg-white/20 active:scale-90 transition-all"
            >
              <LogOut className="h-3 w-3" /> Sign Out
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-lg font-black text-emerald-400">{userPosts.length}</p>
              <p className="text-[10px] text-white/50 uppercase mt-1">Posts</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-lg font-black text-cyan-400">{followerCount}</p>
              <p className="text-[10px] text-white/50 uppercase mt-1">Followers</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-lg font-black text-amber-400">${(currentProfile.coins / 100).toFixed(2)}</p>
              <p className="text-[10px] text-white/50 uppercase mt-1">Balance</p>
            </div>
          </div>

          {/* Bio */}
          {currentProfile.bio && <p className="text-sm text-white/80 mb-4 leading-relaxed">{currentProfile.bio}</p>}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link
              to="/profile/edit"
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-white/10 border border-white/20 py-2.5 text-xs font-bold hover:bg-white/20 active:scale-95 transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </Link>
            <Link
              to="/create"
              search={{ mode: undefined }}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-2.5 text-xs font-bold text-white hover:from-fuchsia-500 hover:to-rose-500 active:scale-95 transition-all"
            >
              <Upload className="h-3.5 w-3.5" /> Create
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-white/5 mt-6">
          <div role="tablist" aria-label="Profile content" className="flex items-center gap-4 px-4 pt-4">
            <button
              role="tab"
              aria-selected={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              className={`text-xs font-black pb-2 border-b-2 transition-all active:scale-95 ${
                activeTab === "posts" ? "text-white border-white" : "text-white/50 border-transparent hover:text-white"
              }`}
            >
              Posts
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "likes"}
              onClick={() => setActiveTab("likes")}
              className={`text-xs font-black pb-2 border-b-2 transition-all active:scale-95 ${
                activeTab === "likes" ? "text-white border-white" : "text-white/50 border-transparent hover:text-white"
              }`}
            >
              Likes
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "saved"}
              onClick={() => setActiveTab("saved")}
              className={`text-xs font-black pb-2 border-b-2 transition-all active:scale-95 ${
                activeTab === "saved" ? "text-white border-white" : "text-white/50 border-transparent hover:text-white"
              }`}
            >
              Saved
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="px-2 pt-4 pb-4 grid grid-cols-2 gap-2">
          {activeTab === "saved" ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
              <Bookmark className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-sm text-white/50">Saved posts coming soon.</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-12 text-center">
              <Upload className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-sm text-white/50">
                {activeTab === "posts" ? "No posts yet. Create your first post!" : "No liked posts yet."}
              </p>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <Link
                key={post.id}
                to="/posts/$id"
                params={{ id: post.id }}
                className="group relative aspect-square rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 overflow-hidden cursor-pointer"
              >
                {post.video_url && <video src={post.video_url} className="h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Play className="h-8 w-8 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <div className="flex gap-3 text-[10px] text-white/80">
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {post.likes_count}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" /> {post.comments_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </MobileShell>
    </>
  );
}
