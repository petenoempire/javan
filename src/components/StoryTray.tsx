import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchStoryReels } from "@/lib/stories";

export function StoryTray() {
  const { user, profile } = useAuth();
  const { data: reels = [] } = useQuery({
    queryKey: ["story-reels", user?.id ?? null],
    queryFn: () => fetchStoryReels(user?.id ?? null),
    staleTime: 30_000,
  });

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto px-3 pt-16 pb-2">
      {/* Your story / add */}
      <Link
        to="/create"
        aria-label="Add to your story"
        className="flex w-16 shrink-0 flex-col items-center gap-1"
      >
        <div className="relative">
          <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/30 bg-black/40">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="bg-gradient-primary h-full w-full" />
            )}
          </div>
          <div className="bg-gradient-primary absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black text-primary-foreground">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </div>
        </div>
        <span className="max-w-[64px] truncate text-[10px] font-semibold text-white/85">Your story</span>
      </Link>

      {reels.map((r) => (
        <Link
          key={r.author.id}
          to="/story/$userId"
          params={{ userId: r.author.id }}
          className="flex w-16 shrink-0 flex-col items-center gap-1"
          aria-label={`Open @${r.author.handle}'s story`}
        >
          <div
            className={`rounded-full p-[2px] ${
              r.has_unseen
                ? "bg-gradient-to-tr from-fuchsia-500 via-rose-500 to-amber-400"
                : "bg-white/25"
            }`}
          >
            <div className="rounded-full border-2 border-black">
              {r.author.avatar_url ? (
                <img src={r.author.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="bg-gradient-primary h-14 w-14 rounded-full" />
              )}
            </div>
          </div>
          <span className="max-w-[64px] truncate text-[10px] font-semibold text-white/85">@{r.author.handle}</span>
        </Link>
      ))}
    </div>
  );
}
