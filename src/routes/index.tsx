import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart, MessageCircle, Share2, Eye, MoreHorizontal, Trash2, Bookmark,
  Film, Radio, TrendingUp, Flame, Users, Music2, Sparkles, Zap,
  ChevronRight, Play, Volume2, VolumeX, Send, Plus, X, Bell,
  Search, Clock, Compass, Repeat2
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "motion/react";
import { fetchActiveLiveStreams } from "@/lib/live";

const HOME_TITLE = "Javan — The Ultimate Short Video Platform for Creators";
const HOME_DESC =
  "Join Javan, the fastest-growing short video platform where creators share live streams, stories, and viral content to earn real rewards and payouts.";

const CATEGORIES = [
  { name: "For You", icon: Compass, color: "cyan" },
  { name: "Following", icon: Users, color: "emerald" },
  { name: "Trending", icon: TrendingUp, color: "orange" },
  { name: "Live", icon: Radio, color: "rose" },
  { name: "STEM", icon: Sparkles, color: "violet" },
  { name: "Drama", icon: Flame, color: "amber" },
  { name: "Community", icon: Users, color: "blue" },
  { name: "Music", icon: Music2, color: "purple" },
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

/* ──────────────────────────────────────────────
   CATEGORY TAB BAR — HORIZONTAL SCROLLABLE
   ────────────────────────────────────────────── */
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
    <div className={isMobile ? "absolute top-24 left-0 right-0 z-20" : "mb-6 border-b border-white/5"}>
      <div
        ref={scrollRef}
        className={`flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth ${isMobile ? "py-3 px-4" : "py-2"}`}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => {
                if (cat.name === "Live") {
                  navigate({ to: "/create", search: { mode: "live" } });
                } else {
                  setActiveCategory(cat.name);
                }
              }}
              className={`relative whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1.5 active:scale-90 ${
                isActive
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <cat.icon className="h-4 w-4" />
              {cat.name === "Live" && (
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
              {cat.name}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-white rounded-full"
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
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESC },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app" }],
  }),
  component: HomePage,
});

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function HomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("For You");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const isNew = localStorage.getItem("javan_new_user_onboarding") === "true";
    if (isNew) setShowOnboarding(true);
  }, []);

  const handleNextOnboarding = () => {
    if (onboardingStep < 3) {
      setOnboardingStep((p) => p + 1);
    } else {
      localStorage.removeItem("javan_new_user_onboarding");
      setShowOnboarding(false);
    }
  };

  // Live Streams Query
  const { data: liveStreams = [] } = useQuery({
    queryKey: ["homepage-active-live-streams"],
    queryFn: fetchActiveLiveStreams,
    refetchInterval: 10000,
  });

  // Posts Query — adapts to category
  const { data: posts = [], isLoading } = useQuery<Post[]>({
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

  // Like handler
  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    try {
      if (isLiked) {
        await supabase.from("video_likes").delete().eq("video_id", postId).eq("user_id", user.id);
        setLikedPosts((prev) => { const n = new Set(prev); n.delete(postId); return n; });
        toast.success("Removed like");
      } else {
        await supabase.from("video_likes").insert({ video_id: postId, user_id: user.id });
        setLikedPosts((prev) => new Set(prev).add(postId));
        toast.success("Post liked!");
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } catch {
      toast.error("Failed to update like");
    }
  }, [user, queryClient]);

  // Share handler
  const handleShare = useCallback(async (postId: string) => {
    try {
      const url = `${window.location.origin}/posts/${postId}`;
      if (navigator.share) {
        await navigator.share({ title: "Check out this post on Javan", url });
        toast.success("Shared!");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch {
      toast.error("Failed to share");
    }
  }, []);

  // Render mobile content based on active category
  const renderMobileContent = () => {
    if (activeCategory === "Live") {
      return (
        <div className="h-full w-full overflow-y-auto no-scrollbar">
          {/* Live Streams Grid */}
          <div className="px-4 pt-4 pb-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-chrome">Live Now</h2>
              <Link
                to="/create"
                search={{ mode: "live" }}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-xs font-bold text-white shadow-glow active:scale-90 transition-all"
              >
                <Plus className="h-3 w-3 inline mr-1" /> Go Live
              </Link>
            </div>
            {liveStreams.length > 0 ? (
              <div className="space-y-3">
                {liveStreams.map((stream: any) => (
                  <Link
                    key={stream.id}
                    to="/live/$id"
                    params={{ id: stream.id }}
                    search={{ host: undefined }}
                    className="block"
                  >
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 glass">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                      <div className="absolute top-3 left-3 z-20 flex gap-2">
                        <span className="bg-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse text-white">LIVE</span>
                        <span className="bg-black/60 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 text-white">
                          <Eye className="h-2.5 w-2.5 text-rose-400" /> {stream.viewer_count || 1}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-rose-500">
                          <AvatarImage src={stream.host?.avatar_url} />
                          <AvatarFallback>{stream.host?.display_name?.[0] || "C"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[10px] text-white/60">@{stream.host?.handle || "creator"}</p>
                          <h3 className="text-sm font-bold line-clamp-1">{stream.title || "Live Stream"}</h3>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center glass rounded-3xl border border-white/5">
                <Radio className="h-10 w-10 text-rose-500/30 mx-auto mb-3 animate-pulse" />
                <p className="text-white/60 font-bold mb-1">No active live streams</p>
                <p className="text-white/40 text-xs mb-4">Start broadcasting to connect with fans!</p>
                <Link
                  to="/create"
                  search={{ mode: "live" }}
                  className="inline-block bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-glow active:scale-90"
                >
                  Go Live Now
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeCategory === "For You" || activeCategory === "Following") {
      return (
        <div className="h-full w-full relative">
          {posts.length > 0 ? (
            <div className="h-full w-full relative">
              {/* Full-screen featured post */}
              {posts[0].image_url ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${posts[0].image_url})` }} />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-black to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

              {/* Right Interaction Panel */}
              <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center z-10">
                <Link
                  to="/u/$handle"
                  params={{ handle: posts[0].author?.handle ?? "user" }}
                  aria-label="View profile"
                >
                  <Avatar className="h-11 w-11 border-2 border-white">
                    <AvatarImage src={posts[0].author?.avatar_url} />
                    <AvatarFallback>{posts[0].author?.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleLike(posts[0].id, !!likedPosts.has(posts[0].id))}
                    className="p-3 rounded-full glass-strong active:scale-90 transition-transform"
                    aria-label="Like"
                  >
                    <Heart className={`h-6 w-6 ${likedPosts.has(posts[0].id) ? "text-rose-500 fill-rose-500" : "text-white"}`} />
                  </button>
                  <span className="text-[11px] font-bold drop-shadow-md">{formatCount(posts[0].likes_count)}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Link
                    to="/posts/$id"
                    params={{ id: posts[0].id }}
                    className="p-3 rounded-full glass-strong active:scale-90 transition-transform"
                    aria-label="Comments"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </Link>
                  <span className="text-[11px] font-bold drop-shadow-md">{formatCount(posts[0].comments_count)}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => handleShare(posts[0].id)}
                    className="p-3 rounded-full glass-strong active:scale-90 transition-transform"
                    aria-label="Share"
                  >
                    <Share2 className="h-6 w-6" />
                  </button>
                  <span className="text-[11px] font-bold drop-shadow-md">{formatCount(posts[0].shares_count || 0)}</span>
                </div>
              </div>

              {/* Bottom Overlay */}
              <div className="absolute bottom-28 left-0 right-14 p-5 z-10">
                <Link
                  to="/u/$handle"
                  params={{ handle: posts[0].author?.handle ?? "user" }}
                  className="mb-2 flex items-center gap-2"
                >
                  <span className="text-base font-black text-white">@{posts[0].author?.handle}</span>
                </Link>
                <p className="text-sm text-white/90 line-clamp-2 leading-snug">{posts[0].content}</p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-10 text-center">
              <Film className="h-16 w-16 text-white/20 mb-4" />
              <p className="text-white/50 text-sm mb-4">No posts found in the {activeCategory} feed yet.</p>
              <Link
                to="/create"
                search={{ mode: undefined }}
                className="px-6 py-2.5 bg-gradient-primary rounded-full text-sm font-bold text-white active:scale-90"
              >
                Start Posting
              </Link>
            </div>
          )}
        </div>
      );
    }

    // Trending / STEM / Drama / Community / Music — Grid View
    return (
      <div className="h-full w-full overflow-y-auto no-scrollbar px-4 pt-4 pb-24">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-black text-chrome">{activeCategory}</h2>
          {activeCategory === "Trending" && <TrendingUp className="h-4 w-4 text-orange-400" />}
        </div>
        {posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {posts.slice(0, 20).map((post) => (
              <Link
                key={post.id}
                to="/posts/$id"
                params={{ id: post.id }}
                className="group block"
              >
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden border border-white/10 mb-2">
                  {post.video_url || post.image_url ? (
                    <img
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.content}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/30 to-black flex items-center justify-center">
                      <Film className="h-8 w-8 text-white/20" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 flex items-center gap-0.5 text-[10px] text-white/90 font-bold bg-black/50 rounded px-1 py-0.5">
                    <Eye className="h-2.5 w-2.5" /> {formatCount(post.views_count)}
                  </div>
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[10px] text-white/90 font-bold bg-black/50 rounded px-1 py-0.5">
                    <Heart className="h-2.5 w-2.5" /> {formatCount(post.likes_count)}
                  </div>
                </div>
                <p className="text-[11px] text-white/60 line-clamp-2">@{post.author?.handle} • {post.content?.slice(0, 40)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center glass rounded-3xl border border-white/5">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Film className="h-7 w-7 text-white/20" />
            </div>
            <h3 className="text-base font-bold mb-1">{activeCategory}</h3>
            <p className="text-white/40 text-sm max-w-xs">No {activeCategory.toLowerCase()} content yet. Check back soon!</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ─── DESKTOP LAYOUT ─── */}
      <DesktopLayout>
        <div className="space-y-8">
          <h1 className="sr-only">{HOME_TITLE}</h1>
          <CategoryScrollBar
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            isMobile={false}
          />

          {/* Live Streams Section */}
          {activeCategory === "Live" ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-chrome">Active Live Streams</h2>
                  <p className="text-white/50 text-sm">Watch creators live right now</p>
                </div>
                <Link
                  to="/create"
                  search={{ mode: "live" }}
                  className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-glow text-white active:scale-90 transition-all"
                >
                  Go Live
                </Link>
              </div>
              {liveStreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {liveStreams.map((stream: any) => (
                    <Link
                      key={stream.id}
                      to="/live/$id"
                      params={{ id: stream.id }}
                      search={{ host: undefined }}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[9/16] rounded-3xl overflow-hidden glass border border-white/10 mb-4 bg-black/60 shadow-lg">
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          <span className="bg-rose-600 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg animate-pulse text-white">LIVE</span>
                          <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-white">
                            <Eye className="h-3 w-3 text-rose-400" /> {stream.viewer_count || 1}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity z-10" />
                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10 border-2 border-rose-500 shadow-glow">
                              <AvatarImage src={stream.host?.avatar_url} />
                              <AvatarFallback>{stream.host?.display_name?.[0] || "C"}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white/70 truncate">@{stream.host?.handle || "creator"}</p>
                              <h3 className="text-sm font-black line-clamp-1 text-white group-hover:text-rose-400 transition-colors">{stream.title || "Live Stream"}</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center glass rounded-3xl border border-white/5 flex flex-col items-center justify-center">
                  <Radio className="h-12 w-12 text-rose-500/30 mb-4 animate-pulse" />
                  <p className="text-white/60 font-bold text-lg mb-2">No active live streams right now</p>
                  <p className="text-white/40 text-sm mb-6 max-w-sm">Be the first to start a live broadcast!</p>
                  <Link
                    to="/create"
                    search={{ mode: "live" }}
                    className="bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3 rounded-2xl text-sm font-bold shadow-glow text-white active:scale-90 transition-all"
                  >
                    Start Broadcasting
                  </Link>
                </div>
              )}
            </div>
          ) : activeCategory === "For You" || activeCategory === "Following" ? (
            posts.length > 0 ? (
              <div className="space-y-6">
                {/* Featured Hero Post */}
                <Link
                  to="/posts/$id"
                  params={{ id: posts[0]?.id }}
                  className="block"
                >
                  <div className="relative aspect-[21/9] rounded-3xl overflow-hidden glass border border-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020210] via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#020210]/80 via-transparent to-transparent z-10" />
                    {posts[0].image_url ? (
                      <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${posts[0].image_url})` }} />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 group-hover:scale-105 transition-transform duration-700" />
                    )}
                    <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
                      <div className="max-w-2xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-cyan-400">
                            <AvatarImage src={posts[0].author?.avatar_url} />
                            <AvatarFallback>{posts[0].author?.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold">@{posts[0].author?.handle}</span>
                        </div>
                        <h2 className="text-4xl font-black text-chrome leading-tight">{posts[0].content}</h2>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>{formatCount(posts[0].views_count)} views</span>
                          <span>•</span>
                          <span>{new Date(posts[0].created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 items-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleLike(posts[0].id, !!likedPosts.has(posts[0].id));
                            }}
                            className="p-3 rounded-full glass hover:bg-white/10 transition-colors"
                          >
                            <Heart className={`h-6 w-6 ${likedPosts.has(posts[0].id) ? "text-rose-500 fill-rose-500" : ""}`} />
                          </button>
                          <span className="text-xs font-bold">{formatCount(posts[0].likes_count)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="p-3 rounded-full glass hover:bg-white/10 transition-colors">
                            <MessageCircle className="h-6 w-6" />
                          </div>
                          <span className="text-xs font-bold">{formatCount(posts[0].comments_count)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Video Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {posts.slice(1).map((post) => (
                    <Link key={post.id} to="/posts/$id" params={{ id: post.id }} className="group cursor-pointer block">
                      <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 mb-3">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                        {post.image_url ? (
                          <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={post.content} />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Film className="h-12 w-12 text-white/10" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Link to="/u/$handle" params={{ handle: post.author?.handle || "user" }}>
                          <Avatar className="h-10 w-10 border border-white/10 hover:border-cyan-400 transition-colors">
                            <AvatarImage src={post.author?.avatar_url} />
                            <AvatarFallback>{post.author?.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold line-clamp-2 group-hover:text-cyan-400 transition-colors">{post.content}</h3>
                          <p className="text-xs text-white/50 mt-1">{post.author?.display_name} • {formatCount(post.views_count)} views</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center glass rounded-3xl border border-white/5">
                <p className="text-white/40">No posts found in the feed yet.</p>
                <Link
                  to="/create"
                  search={{ mode: undefined }}
                  className="mt-4 inline-block text-cyan-400 hover:underline text-sm"
                >
                  Be the first to share something!
                </Link>
              </div>
            )
          ) : (
            /* Other categories: Trending, STEM, Drama, Community, Music */
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-chrome">{activeCategory}</h2>
              </div>
              {posts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {posts.map((post) => (
                    <Link key={post.id} to="/posts/$id" params={{ id: post.id }} className="group cursor-pointer block">
                      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 mb-2">
                        {post.image_url ? (
                          <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={post.content} />
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
                      <p className="text-xs text-white/50 line-clamp-1">@{post.author?.handle}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center glass rounded-3xl border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 mx-auto">
                    <Film className="h-8 w-8 text-white/20" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{activeCategory}</h2>
                  <p className="text-white/40">No content available for this category yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DesktopLayout>

      {/* ─── MOBILE LAYOUT ─── */}
      <MobileShell>
        <h1 className="sr-only">{HOME_TITLE}</h1>
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
          <CategoryScrollBar
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            isMobile={true}
          />
          {renderMobileContent()}
        </div>
      </MobileShell>

      {/* ─── ONBOARDING OVERLAY ─── */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-6 pointer-events-auto lg:hidden"
          >
            <div className="w-full max-w-sm flex items-center justify-between pt-4">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Step {onboardingStep} of 3</span>
              <button
                onClick={() => {
                  localStorage.removeItem("javan_new_user_onboarding");
                  setShowOnboarding(false);
                }}
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
            </div>

            <div className="flex flex-col items-center text-center max-w-sm my-auto">
              <div className="glass-strong rounded-3xl p-6 border border-white/20 shadow-glow">
                <h3 className="text-lg font-black text-chrome uppercase tracking-wide mb-2">
                  {onboardingStep === 1 && "Discover 'For You' Feed"}
                  {onboardingStep === 2 && "Interact & Engage"}
                  {onboardingStep === 3 && "Create & Go Live"}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  {onboardingStep === 1 && "Welcome to Javan! Explore the 'For You' feed to discover trending short videos and live creators."}
                  {onboardingStep === 2 && "Tap the like, comment, and share buttons to interact with creators and build your community."}
                  {onboardingStep === 3 && "Ready to share your talent? Use the bottom navigation to record videos or go live instantly!"}
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm pb-6">
              <button
                onClick={handleNextOnboarding}
                className="bg-gradient-primary w-full rounded-full py-3.5 text-xs font-bold text-white shadow-glow tracking-widest uppercase hover:opacity-95 transition-all active:scale-95"
              >
                {onboardingStep === 3 ? "Start Exploring Javan" : "Next Step →"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
