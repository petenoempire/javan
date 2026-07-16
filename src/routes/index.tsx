import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ 
  head: () => ({ meta: [{ title: "For You · Javan" }] }),
  component: HomePage,
});

interface Post {
  id: string;
  user_id: string;
  content: string;
  video_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  author: { handle: string; display_name: string; avatar_url?: string };
  liked_by_user?: boolean;
}

function HomePage() {
  const { user, profile } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data: rawPosts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      const postList = rawPosts ?? [];
      if (postList.length === 0) return [];

      // Fetch author info separately from the public-safe view,
      // since profiles is now locked down by RLS to owner-only reads.
      const authorIds = [...new Set(postList.map((p: any) => p.user_id))];
      const { data: authors } = await supabase
        .from("public_profiles")
        .select("id, handle, display_name, avatar_url")
        .in("id", authorIds);

      const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a]));

      return postList.map((post: any) => ({
        ...post,
        author: authorMap.get(post.user_id) ?? { handle: "user", display_name: "Unknown" },
      })) as Post[];
    },
  });

  const handleLikePost = async (postId: string) => {
    if (!user) {
      toast.error("Sign in to like posts");
      return;
    }

    try {
      const isLiked = likedPosts.has(postId);
      if (isLiked) {
        await supabase.from("post_likes").delete().match({ post_id: postId, user_id: user.id });
        setLikedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
      toast.success(isLiked ? "Unliked" : "Liked");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error("Failed to update like");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await supabase.from("posts").delete().eq("id", postId);
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error("Failed to delete post");
    }
  };

  const handleReply = (postId: string) => {
    if (!user) {
      toast.error("Sign in to reply");
      return;
    }
    toast.info("Opening reply thread...");
    // Hook this up to your comments/reply route or modal when that view exists
  };

  const handleShare = async (post: Post) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.author?.display_name || "Javan",
          text: post.content,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      }
      await supabase
        .from("posts")
        .update({ shares_count: (post.shares_count || 0) + 1 })
        .eq("id", post.id);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch (err) {
      toast.error("Failed to share post");
    }
  };

  return (
    <MobileShell>
      <div className="px-3 pt-4 pb-20 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-black">For You</h1>
          <div className="flex gap-2">
            <button className="rounded-full bg-white/5 border border-white/10 p-2 hover:bg-white/10 active:scale-90 transition-all">
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Eye className="h-12 w-12 text-white/20 mb-3" />
            <p className="text-sm text-white/50">No posts yet. Follow creators to see content!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500" />
                  <div>
                    <p className="text-xs font-black text-white">{post.author?.display_name || "Unknown"}</p>
                    <p className="text-[10px] text-white/50">@{post.author?.handle || "user"}</p>
                  </div>
                </div>
                {user?.id === post.user_id && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-white/50 hover:text-red-400 active:scale-90 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div className="px-4 py-2">
                <p className="text-sm text-white leading-relaxed">{post.content}</p>
              </div>

              {/* Post Video/Image */}
              {post.video_url && (
                <div className="w-full aspect-video bg-black/50">
                  <video src={post.video_url} className="h-full w-full object-cover" />
                </div>
              )}

              {/* Post Stats */}
              <div className="flex items-center gap-3 px-4 py-2 text-[10px] text-white/50 border-t border-white/5">
                <span>{post.views_count || 0} Views</span>
                <span className="w-px h-3 bg-white/10" />
                <span>{post.likes_count || 0} Likes</span>
                <span className="w-px h-3 bg-white/10" />
                <span>{post.comments_count || 0} Comments</span>
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-around px-2 py-2 border-t border-white/5">
                <button
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all active:scale-90 ${
                    likedPosts.has(post.id)
                      ? "text-rose-400 bg-rose-500/10 border border-rose-500/30"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-white/5"
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                  Like
                </button>
                <button
                  onClick={() => handleReply(post.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 border border-white/5 transition-all active:scale-90"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Reply
                </button>
                <button
                  onClick={() => handleShare(post)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 border border-white/5 transition-all active:scale-90"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </MobileShell>
  );
}
