import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart, MessageCircle, Share2, Eye, Film, Radio, Users, Music2, Sparkles, Flame, Compass
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "motion/react";
import { fetchActiveLiveStreams } from "@/lib/live";

const HOME_TITLE = "Javan — The Ultimate Short Video Platform for Creators";
const HOME_DESC = "Join Javan, the fastest-growing short video platform where creators share live streams, stories, and viral content to earn real rewards and payouts.";

/**
 * EXACT ALLOWED CONTENT TABS (Left-to-Right):
 * LIVE, STEM, Drama, Community, Following, For You
 */
const CATEGORIES = [
  { name: "LIVE", icon: Radio, color: "rose" },
  { name: "STEM", icon: Sparkles, color: "violet" },
  { name: "Drama", icon: Flame, color: "amber" },
  { name: "Community", icon: Users, color: "blue" },
  { name: "Following", icon: Users, color: "emerald" },
  { name: "For You", icon: Compass, color: "cyan" },
];

interface Post {
  id: string;
  user_id: string;
  content: string;
  video_url?: string;
  image_url?: string;
  media_type?: "image" | "video";
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  author: { handle: string; display_name: string; avatar_url?: string };
  liked_by_user?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function CategoryScrollBar({
  activeCategory,
  setActiveCategory,
  isMobile = false,
}: {
  activeCategory: string;
  setActiveCategory: (c: string) => void;
  isMobile?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  return (
    <div className={isMobile ? "absolute top-12 left-0 right-0 z-20" : "mb-6 border-b border-white/5"}>
      <div
        ref={scrollRef}
        className={`flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth ${isMobile ? "py-2.5 px-3" : "py-2"}`}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => {
                if (cat.name === "LIVE") {
                  navigate({ to: "/create", search: { mode: "live" } });
                } else {
                  setActiveCategory(cat.name);
                }
              }}
              className={`relative whitespace-nowrap px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 active:scale-90 shrink-0 ${
                isActive
                  ? "bg-white/15 text-white border border-cyan-500/30 shadow-[0_0_12px_rgba(0,212,255,0.2)]"
                  : "text-white/50 hover:text-white/80 bg-white/5"
              }`}
            >
              <cat.icon className="h-3 w-3" />
              {cat.name === "LIVE" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
              {cat.name}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-cyan-400 rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESC },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESC },
      { property: "og:url", content: "https://javan.lovable.app" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("For You");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: liveStreams = [] } = useQuery({
    queryKey: ["homepage-active-live-streams"],
    queryFn: fetchActiveLiveStreams,
    refetchInterval: 10000,
  });

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ["feed", activeCategory],
    queryFn: async () => {
      const { data: rawPosts, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error || !rawPosts?.length) return [];
      const authorIds = [...new Set(rawPosts.map((p: any) => p.user_id))];
      const { data: authors } = await supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url")
        .in("id", authorIds);
      const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a]));
      return rawPosts.map((post: any) => ({
        ...post,
        author: authorMap.get(post.user_id) ?? { handle: "user", display_name: "Unknown" },
        liked_by_user: false,
      })) as Post[];
    },
  });

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    try {
      if (isLiked) {
        await supabase.from("video_likes").delete().eq("video_id", postId).eq("user_id", user.id);
        setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      } else {
        await supabase.from("video_likes").insert({ video_id: postId, user_id: user.id });
        setLikedPosts((prev) => new Set(prev).add(postId));
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      toast.error("Failed to update like");
    }
  }, [user, queryClient]);

  const handleShare = useCallback(async (postId: string) => {
    try {
      const url = `${window.location.origin}/posts/${postId}`;
      if (navigator.share) {
        await navigator.share({ title: "Check out this post on Javan", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {
      toast.error("Failed to share");
    }
  }, []);

  const renderMobileContent = () => {
    // LIVE tab
    if (activeCategory === "LIVE") {
      return (
        <div className="h-full w-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-chrome">Live Now</h2>
            <Link to="/create" search={{ mode: "live" }} className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-[10px] font-black text-white shadow-glow active:scale-90 transition-all">
              Go Live
            </Link>
          </div>
          {liveStreams.length > 0 ? (
            <div className="space-y-3">
              {liveStreams.map((stream: any) => (
                <Link key={stream.id} to="/live/$id" params={{ id: stream.id }} search={{ host: undefined }} className="block">
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-black/60">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <div className="absolute top-3 left-3 z-20 flex gap-2">
                      <span className="bg-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse text-white">LIVE</span>
                      <span className="bg-black/60 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 text-white">
                        <Eye className="h-2.5 w-2.5 text-rose-400" /> {stream.viewer_count || 1}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-rose-500">
                        <AvatarImage src={stream.host?.avatar_url} />
                        <AvatarFallback>{stream.host?.display_name?.[0] || "C"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-white">@{stream.host?.handle || "creator"}</p>
                        <p className="text-[10px] text-white/60 line-clamp-1">{stream.title || "Live Stream"}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Radio className="h-12 w-12 text-rose-500/30 mb-3 animate-pulse" />
              <p className="text-white/40 text-sm">No active live streams right now.</p>
            </div>
          )}
        </div>
      );
    }

    // For You tab — TikTok-style
    if (activeCategory === "For You") {
      return (
        <div className="h-full w-full overflow-y-auto no-scrollbar">
          {posts.length > 0 ? (
            <Link to="/posts/$id" params={{ id: posts[0].id }} className="block relative h-full w-full">
              <div className="relative h-full w-full bg-black flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-black to-black" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center z-10">
                  <Link to="/u/$handle" params={{ handle: posts[0].author?.handle ?? "user" }}>
                    <Avatar className="h-11 w-11 border-2 border-white">
                      <AvatarImage src={posts[0].author?.avatar_url} />
                      <AvatarFallback>{posts[0].author?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); handleLike(posts[0].id, !!likedPosts.has(posts[0].id)); }} className="p-3 rounded-full bg-black/40 backdrop-blur active:scale-90" aria-label="Like">
                      <Heart className={`h-6 w-6 ${likedPosts.has(posts[0].id) ? "text-rose-500 fill-rose-500" : "text-white"}`} />
                    </button>
                    <span className="text-[11px] font-bold">{formatCount(posts[0].likes_count)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); }} className="p-3 rounded-full bg-black/40 backdrop-blur active:scale-90" aria-label="Comments">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </button>
                    <span className="text-[11px] font-bold">{formatCount(posts[0].comments_count)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); handleShare(posts[0].id); }} className="p-3 rounded-full bg-black/40 backdrop-blur active:scale-90" aria-label="Share">
                      <Share2 className="h-6 w-6 text-white" />
                    </button>
                    <span className="text-[11px] font-bold">{formatCount(posts[0].shares_count || 0)}</span>
                  </div>
                </div>
                <div className="absolute bottom-28 left-0 right-14 p-5 z-10">
                  <Link to="/u/$handle" params={{ handle: posts[0].author?.handle ?? "user" }} className="mb-2 flex items-center gap-2">
                    <span className="text-base font-black text-white">@{posts[0].author?.handle}</span>
                  </Link>
                  <p className="text-sm text-white/90 line-clamp-2 leading-snug">{posts[0].content}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-10 text-center">
              <Film className="h-16 w-16 text-white/20 mb-4" />
              <p className="text-white/50 text-sm mb-4">No posts in the For You feed yet.</p>
            </div>
          )}
        </div>
      );
    }

    // STEM, Drama, Community, Following — Grid View
    return (
      <div className="h-full w-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
        <h2 className="text-base font-black text-chrome mb-3">{activeCategory}</h2>
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {posts.slice(0, 20).map((post) => (
              <Link key={post.id} to="/posts/$id" params={{ id: post.id }} className="group block">
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden border border-white/10 mb-2">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.content} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
                      <Film className="h-10 w-10 text-white/20" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[10px] text-white/90 font-bold bg-black/50 rounded px-1.5 py-0.5">
                    <Eye className="h-2.5 w-2.5" /> {formatCount(post.views_count)}
                  </div>
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[10px] text-white/90 font-bold bg-black/50 rounded px-1.5 py-0.5">
                    <Heart className="h-2.5 w-2.5" /> {formatCount(post.likes_count)}
                  </div>
                </div>
                <p className="text-[11px] text-white/50 line-clamp-1">@{post.author?.handle}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="h-12 w-12 text-white/20 mb-3" />
            <h3 className="text-sm font-bold mb-1">{activeCategory}</h3>
            <p className="text-white/40 text-xs">No content yet. Check back soon!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <DesktopLayout>
        <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
          <h1 className="sr-only">{HOME_TITLE}</h1>
          <CategoryScrollBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} isMobile={false} />
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {posts.slice(0, 20).map((post) => (
                <Link key={post.id} to="/posts/$id" params={{ id: post.id }} className="group cursor-pointer block">
                  <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 mb-3">
                    {post.image_url ? (
                      <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={post.content} />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <Film className="h-12 w-12 text-white/10" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={post.author?.avatar_url} />
                      <AvatarFallback>{post.author?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold line-clamp-2 group-hover:text-cyan-400 transition-colors">{post.content}</h3>
                      <p className="text-xs text-white/50 mt-1">{post.author?.display_name} · {formatCount(post.views_count)} views</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-white/40">No posts found in the feed yet.</p>
            </div>
          )}
        </div>
      </DesktopLayout>
      <MobileShell>
        <h1 className="sr-only">{HOME_TITLE}</h1>
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
          <CategoryScrollBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} isMobile={true} />
          {renderMobileContent()}
        </div>
      </MobileShell>
    </>
  );
}
