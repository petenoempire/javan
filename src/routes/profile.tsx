import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Play, Upload, Edit2, LogOut, Heart, MessageCircle, Bookmark } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ 
  head: () => ({ meta: [{ title: "Profile · Javan" }] }),
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
        .from("followers")
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

  if (!user || !profile) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
          <p className="text-sm text-white/50 mb-4">Loading profile...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
        </div>
      </MobileShell>
    );
  }

  const visiblePosts = activeTab === "posts" ? userPosts : activeTab === "likes" ? likedPosts : [];

  return (
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
              <h1 className="font-display text-2xl font-black">{profile.display_name}</h1>
              <p className="text-sm text-white/50">@{profile.handle}</p>
            </div>
            <button
              onClick={handleSignOut}
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
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-2.5 text-xs font-bold text-white hover:from-fuchsia-500 hover:to-rose-500 active:scale-95 transition-all"
            >
              <Upload className="h-3.5 w-3.5" /> Create
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-white/5 mt-6">
          <div className="flex items-center gap-4 px-4 pt-4">
            <button
              onClick={() => setActiveTab("posts")}
              className={`text-xs font-black pb-2 border-b-2 transition-all active:scale-95 ${
                activeTab === "posts" ? "text-white border-white" : "text-white/50 border-transparent hover:text-white"
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`text-xs font-black pb-2 border-b-2 transition-all active:scale-95 ${
                activeTab === "likes" ? "text-white border-white" : "text-white/50 border-transparent hover:text-white"
              }`}
            >
              Likes
            </button>
            <button
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
                to={`/posts/${post.id}`}
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
  );
}
