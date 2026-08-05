import React, { useState } from "react";
import { Heart, MessageCircle, Share2, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function Feed() {
  const { user } = useAuth();
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const { data: posts = [], isLoading } = trpc.posts.getFeed.useQuery({
    limit: 20,
    offset: 0,
  });

  const likeMutation = trpc.likes.like.useMutation({
    onSuccess: (_, postId) => {
      setLikedPosts((prev) => new Set(prev).add(postId));
    },
  });

  const unlikeMutation = trpc.likes.unlike.useMutation({
    onSuccess: (_, postId) => {
      setLikedPosts((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    },
  });

  const handleLike = (postId: number) => {
    if (likedPosts.has(postId)) {
      unlikeMutation.mutate(postId);
    } else {
      likeMutation.mutate(postId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white/50">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Feed header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur px-4 py-4">
        <h1 className="text-2xl font-bold text-white">For You</h1>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh] text-center">
            <div className="space-y-4">
              <p className="text-white/50">No posts yet</p>
              <Button className="bg-gradient-to-r from-fuchsia-600 to-rose-600">
                Be the first to post
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 px-4">
            {posts.map((post: any) => (
              <div
                key={post.id}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors"
              >
                {/* Post media */}
                <div className="aspect-video bg-black relative">
                  {post.videoUrl ? (
                    <video
                      src={post.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : post.photoUrl ? (
                    <img
                      src={post.photoUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      No media
                    </div>
                  )}
                </div>

                {/* Post info */}
                <div className="p-4 space-y-3">
                  {/* Caption */}
                  {post.caption && (
                    <p className="text-white text-sm">{post.caption}</p>
                  )}

                  {/* Hashtags */}
                  {post.hashtags && Array.isArray(post.hashtags) && (
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-cyan-400 text-xs hover:text-cyan-300 cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-white/50 text-sm">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{post.views || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>{post.likes || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments || 0}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleLike(post.id)}
                      variant="ghost"
                      size="sm"
                      className={`flex-1 gap-2 ${
                        likedPosts.has(post.id)
                          ? "text-rose-500"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      <Heart
                        className="h-4 w-4"
                        fill={likedPosts.has(post.id) ? "currentColor" : "none"}
                      />
                      Like
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-2 text-white/50 hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Comment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-2 text-white/50 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
