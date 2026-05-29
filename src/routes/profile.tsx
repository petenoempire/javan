import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { Share2, Wallet, BarChart3, BadgeCheck, LogOut, Pencil, Link as LinkIcon, MapPin, ShieldCheck, Film } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useRole";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Admiralty" }] }),
  component: Profile,
});

function Profile() {
  const { profile, user, signOut, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [followers, following, videos] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", user!.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", user!.id),
        supabase.from("videos").select("id,thumbnail_url,caption,video_url").eq("user_id", user!.id).eq("status", "active").order("created_at", { ascending: false }),
      ]);
      return { followers: followers.count ?? 0, following: following.count ?? 0, videos: videos.data ?? [] };
    },
  });

  if (loading) return <MobileShell><div className="px-5 pt-20 text-sm text-muted-foreground">Loading…</div></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-primary mb-4 h-16 w-16 rounded-full shadow-glow" />
          <h2 className="font-display text-2xl font-bold">Join Admiralty</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to upload videos, send messages, and follow creators.</p>
          <Link to="/auth" className="bg-gradient-primary mt-6 rounded-full px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            Sign in / Create account
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="relative">
        {profile?.cover_url
          ? <img src={profile.cover_url} className="h-40 w-full object-cover" alt="" />
          : <div className="bg-gradient-primary h-40 w-full opacity-80" />}
        <div className="px-5 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-elegant" alt="" />
              : <div className="bg-gradient-primary h-24 w-24 rounded-full border-4 border-background shadow-elegant" />}
            <div className="flex gap-2">
              <button onClick={() => navigator.share?.({ url: location.href, title: `@${profile?.handle} on Admiralty` }).catch(() => {})}
                className="glass rounded-full p-2"><Share2 className="h-4 w-4" /></button>
              <button onClick={() => signOut().then(() => navigate({ to: "/auth" }))} className="glass rounded-full p-2">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">@{profile?.handle}</h1>
            {profile?.is_verified && <BadgeCheck className="h-5 w-5 fill-accent text-background" />}
          </div>
          <div className="text-sm text-foreground">{profile?.display_name}</div>
          {profile?.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {profile?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
            {profile?.website && <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent"><LinkIcon className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, "")}</a>}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat n={stats?.followers ?? 0} label="Followers" />
            <Stat n={stats?.following ?? 0} label="Following" />
            <Stat n={profile?.coins ?? 0} label="Coins" />
          </div>

          <div className={`mt-4 grid gap-2 ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
            <Link to="/profile/edit" className="bg-gradient-primary flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold text-primary-foreground shadow-glow">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <Link to="/wallet" className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold">
              <Wallet className="h-3.5 w-3.5" /> Wallet
            </Link>
            {!profile?.is_verified ? (
              <Link to="/verify" className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Verify
              </Link>
            ) : (
              <div className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold text-accent">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </div>
            )}
            {isAdmin && (
              <Link to="/admin" className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold">
                <BarChart3 className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-5">
        {stats && stats.videos.length === 0 ? (
          <div className="glass flex flex-col items-center gap-3 rounded-3xl p-8 text-center">
            <Film className="h-7 w-7 text-primary" />
            <div className="font-display font-semibold">No videos yet</div>
            <div className="text-xs text-muted-foreground">Your published videos will appear here.</div>
            <Link to="/create" className="bg-gradient-primary mt-1 rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow">Upload your first</Link>
          </div>
        ) : (
          <div className="mb-3 grid grid-cols-3 gap-1">
            {stats?.videos.map((v: any) => (
              <a key={v.id} href={v.video_url} target="_blank" rel="noreferrer" className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  : <video src={v.video_url} className="h-full w-full object-cover" muted />}
              </a>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="glass rounded-2xl p-3">
      <div className="font-display text-lg font-bold">{n.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
