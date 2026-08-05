import { Button } from "@/components/ui/button";
import { DesktopLayout } from "@/components/DesktopLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Play, Upload, Edit2, LogOut, Heart, MessageCircle, Bookmark } from "lucide-react";
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

  const { data: likedPosts = [] } = useQuery({
    queryKey: ["liked-posts", user?.id],
    enabled: !!user && activeTab === "likes",
    queryFn: async () => {
      const { data } = await supabase
        .from("post_likes")
        .select("post:post_id(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(12);
      return ((data as any[]) ?? []).map((row) => row.post).filter(Boolean) as UserPost[];
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  const { loading: authLoading } = useAuth();

  if (authLoading || (user && !profile)) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
          <p className="text-sm text-white/50 mb-4">Loading profile...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
        </div>
      </MobileShell>
    );
  }

  if (!user) {
    navigate({ to: "/auth" });
    return null;
  }

  if (!profile) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center px-8">
          <p className="text-sm text-white/50 mb-4">Profile not found. Please try signing in again.</p>
          <Button onClick={() => navigate({ to: "/auth" })} className="bg-gradient-primary rounded-xl">Go to Sign In</Button>
        </div>
      </MobileShell>
    );
  }

  const visiblePosts = activeTab === "posts" ? userPosts : activeTab === "likes" ? likedPosts : [];

  return (
    <>
    <DesktopLayout>
      <div className="max-w-4xl mx-auto py-10">
        {/* Header */}
        <div className="relative h-48 rounded-3xl overflow-hidden bg-gradient-to-r from-fuchsia-600 to-rose-600 shadow-glow mb-16">
          <div className="absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 border-4 border-[#020210] shadow-glow" />
        </div>

        {/* Profile Info */}
        <div className="px-8 flex items-start justify-between mb-8">
          <div>
            <h2 className="font-display text-4xl font-black text-chrome">{profile.display_name}</h2>
            <p className="text-lg text-white/50">@{profile.handle}</p>
            {profile.bio && <p className="text-base text-white/80 mt-4 max-w-xl leading-relaxed">{profile.bio}</p>}
          </div>
          <div className="flex gap-3">
            <Link to="/profile/edit">
              <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5">
                <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            </Link>
            <Button onClick={handleSignOut} variant="destructive" className="rounded-xl">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
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
            <p className="text-3xl font-black text-amber-400">${(profile.coins / 100).toFixed(2)}</p>
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
      <div className="pb-20">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-fuchsia-600 to-rose-600">
          <div className="absolute -bottom-10 left-4 h-20 w-20 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 border-4 border-black" />
        </div>

        {/* Profile Info */}
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-black" role="heading" aria-level={1}>{profile.display_name}</h1>
              <p className="text-sm text-white/50">@{profile.handle}</p>
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
              <p className="text-lg font-black text-amber-400">${(profile.coins / 100).toFixed(2)}</p>
              <p className="text-[10px] text-white/50 uppercase mt-1">Balance</p>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && <p className="text-sm text-white/80 mb-4 leading-relaxed">{profile.bio}</p>}

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
