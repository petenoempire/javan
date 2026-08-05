import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { DesktopLayout } from "@/components/DesktopLayout";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Search, Compass, TrendingUp, Music, Film, Rocket, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/discover")({ 
  head: () => ({
    meta: [
      { title: "Discover Trending Creators & Viral Videos · Javan" },
      { name: "description", content: "Explore the best content on Javan. Discover new creators, trending short videos, and viral stories across STEM, Drama, and more. Find your next favorite creator today." },
      { property: "og:title", content: "Discover Trending Creators & Viral Videos · Javan" },
      { property: "og:description", content: "Explore the best content on Javan. Discover new creators, trending short videos, and viral stories across STEM, Drama, and more." },
      { property: "og:url", content: "https://javan.lovable.app/discover" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Discover Trending Creators & Viral Videos · Javan" },
      { name: "twitter:description", content: "Find new creators and viral short videos on Javan." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/discover" }],
  }),
  component: DiscoverPage,
});

interface Creator {
  id: string;
  handle: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  followers_count: number;
  is_verified: boolean;
}

function DiscoverPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["discover-creators", search],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").limit(20);
      if (search) {
        query = query.or(`handle.ilike.%${search}%,display_name.ilike.%${search}%`);
      }
      const { data } = await query;
      return (data as Creator[]) ?? [];
    },
  });

  const categories = [
    { name: "Music", icon: Music, color: "bg-fuchsia-500", count: "Original tracks", href: "/music" },
    { name: "Drama", icon: Film, color: "bg-rose-500", count: "Cinematic shorts", href: "/drama" },
    { name: "STEM", icon: Rocket, color: "bg-blue-500", count: "Educational content", href: "/stem" },
    { name: "Community", icon: Users, color: "bg-cyan-500", count: "Connect with others", href: "/community" },
  ];

  const handleFollowToggle = async (creatorId: string) => {
    if (!user) {
      toast.error("Sign in to follow creators");
      return;
    }

    try {
      const isFollowing = followingIds.has(creatorId);
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .match({ follower_id: user.id, following_id: creatorId });
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
        toast.success("Unfollowed");
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: creatorId });
        setFollowingIds((prev) => new Set(prev).add(creatorId));
        toast.success("Following");
      }
    } catch (err) {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Compass className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-chrome tracking-tight">Discover Creators</h1>
              <p className="text-white/50">Explore categories and find new creators to follow.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {categories.map((cat) => (
              <Link key={cat.name} to={cat.href as any} className="glass p-6 rounded-3xl border border-white/5 hover:bg-white/5 transition-all cursor-pointer group">
                <div className={`${cat.color} h-12 w-12 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <cat.icon className="h-6 w-6 text-white" />
                </div>
	                <h2 className="text-sm font-bold">{cat.name}</h2>
                <p className="text-xs text-white/40 mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>

          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  Suggested Creators
                </h2>
                <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                   <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search creators..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs outline-none focus:border-cyan-500/50"
                   />
                </div>
             </div>
             
             {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse"></div>)}
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {creators.map(creator => (
                      <div key={creator.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                         <Link to="/u/$handle" params={{ handle: creator.handle }} className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600"></div>
                            <div>
                               <p className="text-sm font-bold">{creator.display_name}</p>
                               <p className="text-[10px] text-white/40">@{creator.handle}</p>
                            </div>
                         </Link>
                         <button 
                            onClick={() => handleFollowToggle(creator.id)}
                            className="px-4 py-1.5 rounded-lg bg-white/10 text-[10px] font-bold hover:bg-white/20 transition-colors"
                         >
                            {followingIds.has(creator.id) ? "Following" : "Follow"}
                         </button>
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </DesktopLayout>

      <MobileShell>
        <div className="px-5 pt-4 pb-20">
          <h1 className="sr-only">Discover New Content & Trending Creators</h1>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input 
              type="text" 
              aria-label="Search creators"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Javan" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-cyan-500/50"
            />
          </div>

          <h2 className="text-lg font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
             {categories.map((cat) => (
                <Link key={cat.name} to={cat.href as any} className="glass p-4 rounded-2xl border border-white/5">
                   <cat.icon className="h-5 w-5 text-white/60 mb-2" />
                   <p className="text-sm font-bold">{cat.name}</p>
                </Link>
             ))}
          </div>

          <h2 className="text-lg font-bold mb-4">Suggested</h2>
          <div className="space-y-3">
             {creators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between">
                   <Link to="/u/$handle" params={{ handle: creator.handle }} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white/5"></div>
                      <div>
                         <p className="text-sm font-bold">{creator.display_name}</p>
                         <p className="text-[10px] text-white/40">@{creator.handle}</p>
                      </div>
                   </Link>
                   <button 
                      onClick={() => handleFollowToggle(creator.id)}
                      className="text-[10px] font-bold text-cyan-400"
                   >
                      {followingIds.has(creator.id) ? "Following" : "Follow"}
                   </button>
                </div>
             ))}
          </div>
        </div>
      </MobileShell>
    </>
  );
}
