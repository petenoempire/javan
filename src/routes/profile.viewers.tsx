import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Eye, UserRoundCheck } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile/viewers")({
  head: () => ({ meta: [{ title: "Profile viewers · Boogle" }] }),
  component: ProfileViewers,
});

function ProfileViewers() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data = [], isLoading } = useQuery({
    queryKey: ["profile-viewers", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("profile_views")
        .select("viewer_id,viewed_at")
        .eq("profile_id", user!.id)
        .order("viewed_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      const ids = (rows ?? []).map((row) => row.viewer_id);
      if (!ids.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,bio,is_verified")
        .in("id", ids);

      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      return (rows ?? []).map((row) => ({ ...row, profile: profileMap.get(row.viewer_id) })).filter((row) => row.profile);
    },
  });

  if (!loading && !user) {
    navigate({ to: "/auth" });
    return null;
  }

  return (
    <MobileShell>
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <button type="button" onClick={() => navigate({ to: "/profile" })} className="p-1" aria-label="Back to profile">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold">Viewers</h1>
          <p className="text-xs text-muted-foreground">People who visited your profile</p>
        </div>
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full text-primary">
          <Eye className="h-5 w-5" />
        </div>
      </header>

      <div className="px-3 py-3">
        {loading || isLoading ? (
          <div className="px-3 pt-10 text-sm text-muted-foreground">Loading viewers…</div>
        ) : data.length === 0 ? (
          <div className="glass mt-10 rounded-3xl p-10 text-center">
            <UserRoundCheck className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 font-display font-semibold">No profile visits yet</div>
            <div className="mt-1 text-xs text-muted-foreground">When signed-in people visit your profile, they’ll appear here.</div>
          </div>
        ) : (
          <ul className="glass divide-y divide-border/40 overflow-hidden rounded-2xl">
            {data.map((row: any) => (
              <li key={row.viewer_id}>
                <Link to="/u/$handle" params={{ handle: row.profile.handle }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 active:bg-muted/60">
                  {row.profile.avatar_url ? (
                    <img src={row.profile.avatar_url} className="h-11 w-11 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="bg-gradient-primary h-11 w-11 rounded-full" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 truncate text-sm font-semibold">
                      @{row.profile.handle}
                      {row.profile.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-accent text-background" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{row.profile.display_name}</div>
                  </div>
                  <time className="text-[10px] text-muted-foreground">{formatVisit(row.viewed_at)}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

function formatVisit(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
