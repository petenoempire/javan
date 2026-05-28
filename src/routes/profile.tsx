import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { videos } from "@/lib/mock";
import { Settings, Share2, Wallet, BarChart3, BadgeCheck, LogOut, Pencil, Link as LinkIcon, MapPin } from "lucide-react";
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

  if (loading) return <MobileShell><div className="px-5 pt-20 text-sm text-muted-foreground">Loading…</div></MobileShell>;

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-primary mb-4 h-16 w-16 rounded-full shadow-glow" />
          <h2 className="font-display text-2xl font-bold">Join Admiralty</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to edit your profile, send gifts, and follow creators.</p>
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
        {profile?.cover_url ? (
          <img src={profile.cover_url} className="h-40 w-full object-cover" alt="" />
        ) : (
          <div className="bg-gradient-primary h-40 w-full opacity-80" />
        )}
        <div className="px-5 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-elegant" alt="" />
            ) : (
              <div className="bg-gradient-primary h-24 w-24 rounded-full border-4 border-background shadow-elegant" />
            )}
            <div className="flex gap-2">
              <button className="glass rounded-full p-2"><Share2 className="h-4 w-4" /></button>
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
            <div className="glass rounded-2xl p-3"><div className="font-display text-lg font-bold">0</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</div></div>
            <div className="glass rounded-2xl p-3"><div className="font-display text-lg font-bold">0</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Following</div></div>
            <div className="glass rounded-2xl p-3"><div className="font-display text-lg font-bold">{profile?.coins ?? 0}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coins</div></div>
          </div>

          <div className={`mt-4 grid gap-2 ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
            <Link to="/profile/edit" className="bg-gradient-primary flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold text-primary-foreground shadow-glow">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <Link to="/wallet" className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold">
              <Wallet className="h-3.5 w-3.5" /> Wallet
            </Link>
            {isAdmin && (
              <Link to="/admin" className="glass flex items-center justify-center gap-1 rounded-2xl py-3 text-xs font-semibold">
                <BarChart3 className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="mb-3 grid grid-cols-3 gap-1">
          {videos.concat(videos).map((v, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-md">
              <img src={v.poster} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
