import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { StoryTray } from "@/components/StoryTray";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Eye, MoreHorizontal, Trash2, Bookmark, Plus, Film } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

const HOME_TITLE = "Javan Feed — Live Videos & Creator Posts";
const HOME_DESC = "Browse the Javan For You feed: short videos, live streams and stories from creators earning coins and payouts on Javan.";

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
                onClick={() => setActiveCategory(category.name)}
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
      { name: "twitter:title", content: HOME_TITLE },
      { name: "twitter:description", content: HOME_DESC },
      { property: "og:url", content: "https://javan.lovable.app" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app" }],
  }),
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('For You');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

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
                <Link to={`/u/${posts[0].author?.handle}`} aria-label={`View ${posts[0].author?.display_name}'s profile`}>
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
                <h3 className="text-lg font-black flex items-center gap-2">
                  {posts[0].author?.display_name}
                </h3>
                <p className="text-sm mt-2 line-clamp-2 leading-snug font-medium">
                  {posts[0].content}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-10 text-center">
              <p className="text-white/40">No posts found in the {activeCategory} feed yet.</p>
              <Link to="/create" className="mt-4 px-6 py-2 bg-gradient-primary rounded-full text-sm font-bold">Start Posting</Link>
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
          {/* Category Navigation Bar for Desktop */}
          <CategoryScrollBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} isMobile={false} />

          {/* Featured Banner - Only show if there are posts and on For You/Following */}
          {(activeCategory === 'For You' || activeCategory === 'Following') && posts.length > 0 ? (
            <div className="relative aspect-[21/9] rounded-3xl overflow-hidden glass border border-white/10 group cursor-pointer">
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
                      <AvatarImage src={posts[0].author?.avatar_url} />
                      <AvatarFallback>{posts[0].author?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold">@{posts[0].author?.handle}</span>
                  </div>
                  <h1 className="text-4xl font-black text-chrome leading-tight">
                    {posts[0].content}
                  </h1>
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
                    <div key={post.id} className="group cursor-pointer">
                      <div className="relative aspect-video rounded-2xl overflow-hidden glass border border-white/10 mb-3">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10"></div>
                        {post.image_url ? (
                          <img src={post.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <Film className="h-12 w-12 text-white/10" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Link to={`/u/${post.author?.handle || 'user'}`}>
                          <Avatar className="h-10 w-10 border border-white/10 hover:border-cyan-400 transition-colors">
                            <AvatarImage src={post.author?.avatar_url} />
                            <AvatarFallback>{post.author?.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold line-clamp-2 group-hover:text-cyan-400 transition-colors">{post.content}</h3>
                          <p className="text-xs text-white/50 mt-1">{post.author?.display_name} • {post.views_count} views</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
                    <p className="text-white/40">No posts found in the feed yet.</p>
                    <Link to="/create" className="mt-4 inline-block text-cyan-400 hover:underline">Be the first to share something!</Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DesktopLayout>

      {/* Mobile Version - TikTok Style */}
      <MobileShell>
        <h1 className="sr-only">Javan Home Feed</h1>
        <div className="fixed inset-0 z-0 overflow-hidden bg-black">
          {/* Category Tabs - Smooth Scrollable Bar */}
          <CategoryScrollBar activeCategory={activeCategory} setActiveCategory={setActiveCategory} isMobile={true} />

          {/* Full Screen Feed */}
          {renderMobileContent()}
        </div>
      </MobileShell>
    </>
  );
}