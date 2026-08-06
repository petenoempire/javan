import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { StoryTray } from "@/components/StoryTray";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Eye, MoreHorizontal, Trash2, Bookmark, Plus, Film, Radio } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { fetchActiveLiveStreams } from "@/lib/live";

const HOME_TITLE = "Javan — The Ultimate Short Video Platform for Creators";
const HOME_DESC = "Join Javan, the fastest-growing short video platform where creators share live streams, stories, and viral content to earn real rewards and payouts.";

const CATEGORIES = [
  { name: 'Live', badge: 'LIVE' },
  { name: 'STEM' },
  { name: 'Drama' },
  { name: 'Community' },
  { name: 'Following' },
  { name: 'For You' },
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

interface CategoryScrollBarProps {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  isMobile?: boolean;
}

function CategoryScrollBar({ activeCategory, setActiveCategory, isMobile = false }: CategoryScrollBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, scroll to the end (For You) as it's the default
    if (scrollContainerRef.current) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className={isMobile ? "absolute top-28 left-0 right-0 z-20" : "mb-6 border-b border-white/5"}>
      <div className="relative flex items-center">
        {/* Scrollable container - Arrows and gradients removed as requested */}
        <div
          ref={scrollContainerRef}
          className={`flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth ${isMobile ? "py-3 px-4" : "py-2"}`}
        >
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => {
                  if (category.name === "Live") {
                    navigate({ to: "/create", search: { mode: "live" } });
                  } else {
                    setActiveCategory(category.name);
                  }
                }}
                className={`relative whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                {category.badge === 'LIVE' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                {category.name}
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

function HomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('For You');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    const isNew = localStorage.getItem("javan_new_user_onboarding") === "true";
    if (isNew) {
      setShowOnboarding(true);
    }
  }, []);

  const handleNextOnboarding = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
    } else {
      localStorage.removeItem("javan_new_user_onboarding");
      setShowOnboarding(false);
    }
  };

  const { data: liveStreams = [], isLoading: isLoadingLive } = useQuery({
    queryKey: ["homepage-active-live-streams"],
    queryFn: fetchActiveLiveStreams,
    refetchInterval: 10000,
  });

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["feed", activeCategory],
    queryFn: async () => {
      try {
        const { data: rawPosts, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          return [];
        }

        const postList = rawPosts ?? [];
        if (postList.length === 0) return [];

        const authorIds = [...new Set(postList.map((p: any) => p.user_id))];
        const { data: authors, error: authorsError } = await supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_url")
          .in("id", authorIds);

        if (authorsError) {
          console.error("Error fetching authors:", authorsError);
        }

        const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a]));

        return postList.map((post: any) => ({
          ...post,
          author: authorMap.get(post.user_id) ?? { handle: "user", display_name: "Unknown" },
          liked_by_user: false // Initialize with default value
        })) as Post[];
      } catch (err) {
        console.error("Feed query error:", err);
        return [];
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <>
        <DesktopLayout>
          <div className="space-y-8">
            <div className="h-40 rounded-3xl glass animate-pulse"></div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="aspect-video rounded-2xl glass animate-pulse"></div>)}
            </div>
          </div>
        </DesktopLayout>
        <MobileShell>
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        </MobileShell>
      </>
    );
  }

  const renderMobileContent = () => {
    if (activeCategory === 'Live') {
      return (
        <div className="h-full w-full overflow-y-auto px-4 py-6 space-y-4 pb-28">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-chrome">Live Now</h2>
            <Link to="/create" search={{ mode: "live" }} className="bg-gradient-live px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-glow">
              Go Live
            </Link>
          </div>
          {liveStreams.length > 0 ? (
            liveStreams.map((stream: any) => (
              <Link key={stream.id} to="/live/$id" params={{ id: stream.id }} search={{ host: undefined }} className="relative block aspect-[9/16] rounded-3xl bg-black/50 border border-white/10 overflow-hidden shadow-xl mb-4">
                 <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <span className="bg-rose-600 text-[9px] font-black px-2.5 py-1 rounded-md shadow-lg animate-pulse text-white">LIVE</span>
                    <span className="bg-black/60 backdrop-blur-md text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 text-white">
                      <Eye className="h-3 w-3 text-rose-400" /> {stream.viewer_count || 1}
                    </span>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                 <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10 border-2 border-rose-500">
                        <AvatarImage src={stream.host?.avatar_url} />
                        <AvatarFallback>{stream.host?.display_name?.[0] || "C"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white/70 truncate">@{stream.host?.handle || "creator"}</p>
                        <h3 className="text-base font-black line-clamp-1 text-white">{stream.title || "Live Stream"}</h3>
                      </div>
                    </div>
                 </div>
              </Link>
            ))
          ) : (
            <div className="py-20 text-center glass rounded-3xl border border-white/5 px-6">
              <Radio className="h-10 w-10 text-rose-500/30 mx-auto mb-3 animate-pulse" />
              <p className="text-white/60 font-bold mb-1">No active live streams</p>
              <p className="text-white/40 text-xs mb-6">Start broadcasting to connect with fans!</p>
              <Link to="/create" search={{ mode: "live" }} className="inline-block bg-gradient-live px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-glow">
                Go Live
              </Link>
            </div>
          )}
        </div>
      );
    }
    if (activeCategory === 'For You' || activeCategory === 'Following') {
      return (
        <div className="h-full w-full relative">
          {posts.length > 0 ? (
            <div className="h-full w-full relative">
              {/* Background Video/Image */}
              {posts[0].image_url ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${posts[0].image_url})` }}></div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-black to-black"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
              
              {/* Right Interaction Panel */}
              <div className="absolute right-4 bottom-32 flex flex-col gap-5 items-center z-10">
                <Link to="/u/$handle" params={{ handle: posts[0].author?.handle ?? "user" }} aria-label={`View ${posts[0].author?.display_name}'s profile`}>
                  <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={posts[0].author?.avatar_url} />
                    <AvatarFallback>{posts[0].author?.display_name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                
                <div className="flex flex-col items-center gap-1">
                  <button 
                    className="p-3 rounded-full glass-strong active:scale-90 transition-transform"
                    aria-label={posts[0].liked_by_user ? "Unlike post" : "Like post"}
                  >
                    <Heart className={`h-7 w-7 ${posts[0].liked_by_user ? "text-rose-500 fill-rose-500" : ""}`} />
                  </button>
                  <span className="text-xs font-bold drop-shadow-md">{posts[0].likes_count}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <button 
                    className="p-3 rounded-full glass-strong active:scale-90 transition-transform"
                    aria-label="View comments"
                  >
                    <MessageCircle className="h-7 w-7" />
                  </button>
                  <span className="text-xs font-bold drop-shadow-md">{posts[0].comments_count}</span>
                </div>
              </div>

              {/* Bottom Overlay */}
              <div className="absolute bottom-32 left-0 right-16 p-6 z-10">
                <h2 className="text-lg font-black flex items-center gap-2">
                  {posts[0].author?.display_name}
                </h2>
                <p className="text-sm mt-2 line-clamp-2 leading-snug font-medium">
                  {posts[0].content}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-10 text-center">
              <p className="text-white/40">No posts found in the {activeCategory} feed yet.</p>
              <Link to="/create" search={{ mode: undefined }} className="mt-4 px-6 py-2 bg-gradient-primary rounded-full text-sm font-bold">Start Posting</Link>
            </div>
          )}
        </div>
      );
    }

    // Placeholder for other categories
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-10 text-center bg-black/20 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Film className="h-8 w-8 text-white/20" />
        </div>
        <h2 className="text-xl font-bold mb-2">{activeCategory}</h2>
        <p className="text-white/40 max-w-xs">No {activeCategory.toLowerCase()} content found. Check back later or explore other categories!</p>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Version */}
      <DesktopLayout>
        <div className="space-y-8">
          <h1 className="sr-only">Javan Home Feed — Explore Trending Short Videos and Live Creators</h1>
          {/* Category Navigation Bar for Desktop */}
          <CategoryScrollBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} isMobile={false} />

          {/* Live Streams Feed on Desktop */}
          {activeCategory === 'Live' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-chrome">Active Live Streams</h2>
                  <p className="text-white/50 text-sm">Watch creators live right now</p>
                </div>
                <Link to="/create" search={{ mode: "live" }} className="bg-gradient-live px-6 py-2.5 rounded-2xl text-sm font-bold shadow-glow text-white">
                  Go Live
                </Link>
              </div>
              {liveStreams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {liveStreams.map((stream: any) => (
                    <Link key={stream.id} to="/live/$id" params={{ id: stream.id }} search={{ host: undefined }} className="group cursor-pointer">
                      <div className="relative aspect-[9/16] rounded-3xl overflow-hidden glass border border-white/10 mb-4 bg-black/60 shadow-lg">
                         <div className="absolute top-4 left-4 z-20 flex gap-2">
                            <span className="bg-rose-600 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg animate-pulse text-white">LIVE</span>
                            <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-white">
                              <Eye className="h-3 w-3 text-rose-400" /> {stream.viewer_count || 1}
                            </span>
                         </div>
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity z-10"></div>
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
                  <p className="text-white/40 text-sm mb-6 max-w-sm">Be the first to start a live broadcast and connect with your audience in real-time!</p>
                  <Link to="/create" search={{ mode: "live" }} className="bg-gradient-live px-6 py-3 rounded-2xl text-sm font-bold shadow-glow text-white">
                    Start Broadcasting
                  </Link>
                </div>
              )}
            </div>
          ) : (activeCategory === 'For You' || activeCategory === 'Following') && posts.length > 0 ? (
            <Link to="/posts/$id" params={{ id: posts[0]?.id }} className="block">
              <div className="relative aspect-[21/9] rounded-3xl overflow-hidden glass border border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#020210] via-transparent to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#020210]/80 via-transparent to-transparent z-10"></div>
              {posts[0].image_url ? (
                <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${posts[0].image_url})` }}></div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 group-hover:scale-105 transition-transform duration-700"></div>
              )}
              
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full flex justify-between items-end">
                <div className="max-w-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-cyan-400">
                      <AvatarImage src={posts[0].author?.avatar_url} alt={`${posts[0].author?.display_name}'s avatar`} />
                      <AvatarFallback>{posts[0].author?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold">@{posts[0].author?.handle}</span>
                  </div>
                  <h2 className="text-4xl font-black text-chrome leading-tight">
                    {posts[0].content}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-white/60">
                    <span>{posts[0].views_count} views</span>
                    <span>•</span>
                    <span>{new Date(posts[0].created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="p-3 rounded-full glass hover:bg-white/10 transition-colors">
                      <Heart className={`h-6 w-6 ${posts[0].liked_by_user ? "text-rose-500 fill-rose-500" : ""}`} />
                    </div>
                    <span className="text-xs font-bold">{posts[0].likes_count}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="p-3 rounded-full glass hover:bg-white/10 transition-colors">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold">{posts[0].comments_count}</span>
                  </div>
                </div>
              </div>
            </div>
              </Link>
          ) : activeCategory !== 'For You' && activeCategory !== 'Following' ? (
            <div className="py-20 text-center glass rounded-3xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 mx-auto">
                <Film className="h-8 w-8 text-white/20" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{activeCategory}</h2>
              <p className="text-white/40">No content available for this category yet.</p>
            </div>
          ) : null}

          {/* Video Grid */}
          {(activeCategory === 'For You' || activeCategory === 'Following') && (
            <>
              <h2 className="sr-only">Recommended Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <Link key={post.id} to="/posts/$id" params={{ id: post.id }} className="group cursor-pointer block">
                      <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 mb-3">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                        {post.image_url ? (
                          <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={`Post by ${post.author?.display_name}: ${post.content}`} />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Film className="h-12 w-12 text-white/10" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Link to="/u/$handle" params={{ handle: post.author?.handle || "user" }}>
                          <Avatar className="h-10 w-10 border border-white/10 hover:border-cyan-400 transition-colors">
                            <AvatarImage src={post.author?.avatar_url} alt={`${post.author?.display_name}'s avatar`} />
                            <AvatarFallback>{post.author?.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold line-clamp-2 group-hover:text-cyan-400 transition-colors">{post.content}</h3>
                          <p className="text-xs text-white/50 mt-1">{post.author?.display_name} • {post.views_count} views</p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
                    <p className="text-white/40">No posts found in the feed yet.</p>
                    <Link to="/create" search={{ mode: undefined }} className="mt-4 inline-block text-cyan-400 hover:underline">Be the first to share something!</Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DesktopLayout>

      {/* Mobile Version - TikTok Style */}
      <MobileShell>
        <h1 className="sr-only">Javan Home Feed — Explore Trending Short Videos</h1>
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
          {/* Category Tabs - Smooth Scrollable Bar */}
          <CategoryScrollBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} isMobile={true} />

          {/* Full Screen Feed */}
          {renderMobileContent()}
        </div>
      </MobileShell>

      {/* New User Onboarding Tutorial Overlay with Animated Blinking Arrows */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-6 pointer-events-auto">
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

          <div className="flex flex-col items-center text-center max-w-sm my-auto relative">
            {onboardingStep === 1 && (
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                <span className="text-cyan-400 text-3xl font-black">⬆</span>
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
              </div>
            )}
            {onboardingStep === 2 && (
              <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 flex items-center animate-pulse">
                <span className="text-cyan-400 text-3xl font-black">⬅</span>
              </div>
            )}
            {onboardingStep === 3 && (
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping mb-1"></div>
                <span className="text-cyan-400 text-3xl font-black">⬇</span>
              </div>
            )}

            <div className="glass-strong rounded-3xl p-6 border border-white/20 shadow-glow relative z-10">
              <h3 className="text-lg font-black text-chrome uppercase tracking-wide mb-2">
                {onboardingStep === 1 && "Discover 'For You' Feed"}
                {onboardingStep === 2 && "Interact & Engage"}
                {onboardingStep === 3 && "Create & Go Live"}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                {onboardingStep === 1 && "Welcome to Javan! Explore the 'For You' feed right here to discover trending short videos and live creators."}
                {onboardingStep === 2 && "Tap the like, comment, and share buttons on the right side of any video to interact with creators."}
                {onboardingStep === 3 && "Ready to share your talent? Use the bottom navigation to record your own videos or go live instantly!"}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm pb-6">
            <button
              onClick={handleNextOnboarding}
              className="bg-gradient-primary w-full rounded-full py-3.5 text-xs font-bold text-white shadow-glow tracking-widest uppercase hover:opacity-95 transition-all"
            >
              {onboardingStep === 3 ? "Start Exploring Javan" : "Next Step →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}