import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, X, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/discover")({ 
  head: () => ({
    meta: [
      { title: "Discover Creators · Javan" },
      { name: "description", content: "Find and follow new creators on Javan. Search by name or handle to discover fresh video and live content." },
      { property: "og:title", content: "Discover Creators · Javan" },
      { property: "og:description", content: "Find and follow new creators on Javan. Search by name or handle to discover fresh video and live content." },
      { property: "og:url", content: "https://javan.lovable.app/discover" },
      { name: "twitter:title", content: "Discover Creators · Javan" },
      { name: "twitter:description", content: "Find and follow new creators on Javan. Search by name or handle to discover fresh video and live content." },
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
      let query = supabase.from("users").select("*").limit(20);
      if (search) {
        query = query.or(`handle.ilike.%${search}%,display_name.ilike.%${search}%`);
      }
      const { data } = await query;
      return (data as Creator[]) ?? [];
    },
  });

  const handleFollowToggle = async (creatorId: string) => {
    if (!user) {
      toast.error("Sign in to follow creators");
      return;
    }

    try {
      const isFollowing = followingIds.has(creatorId);
      if (isFollowing) {
        await supabase
          .from("followers")
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
          .from("followers")
          .insert({ follower_id: user.id, following_id: creatorId });
        setFollowingIds((prev) => new Set(prev).add(creatorId));
        toast.success("Following");
      }
    } catch (err) {
      toast.error("Failed to update follow status");
    }
  };

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <h1 className="font-display text-2xl font-black mb-4">Discover</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all"
          />
        </div>

        {/* Creators Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white"></div>
          </div>
        ) : creators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-white/50">No creators found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-all"
              >
                <Link
                  to="/u/$handle"
                  params={{ handle: creator.handle }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-bold text-xs truncate">{creator.display_name}</p>
                      {creator.is_verified && <CheckCircle className="h-3 w-3 text-cyan-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-white/50">@{creator.handle}</p>
                  </div>
                </Link>
                <button
                  onClick={() => handleFollowToggle(creator.id)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-90 ${
                    followingIds.has(creator.id)
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white"
                  }`}
                >
                  <UserPlus className="h-3 w-3" />
                  {followingIds.has(creator.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  );
}
