import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, BadgeCheck, MapPin, Link as LinkIcon, MessageCircle, UserPlus, UserCheck, Flag } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/ReportDialog";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({ meta: [{ title: `@${params.handle} · Admiralty` }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", handle, user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("handle", handle).maybeSingle();
      if (!profile) return null;
      const [{ count: followers }, { count: following }, { data: videos }] = await Promise.all([
        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
        supabase.from("videos").select("id,thumbnail_url,video_url,caption").eq("user_id", profile.id).eq("status", "active").order("created_at", { ascending: false }),
      ]);
      let isFollowing = false;
      if (user && user.id !== profile.id) {
        const { data: f } = await supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profile.id).maybeSingle();
        isFollowing = !!f;
      }
      return { profile, followers: followers ?? 0, following: following ?? 0, videos: videos ?? [], isFollowing };
    },
  });

  const toggleFollow = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (!data?.profile || user.id === data.profile.id) return;
    if (data.isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", data.profile.id);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: data.profile.id });
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["public-profile", handle] });
  };

  const startMessage = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (!data?.profile || user.id === data.profile.id) return;
    const { data: cid, error } = await supabase.rpc("get_or_create_conversation", { other_id: data.profile.id });
    if (error || !cid) return toast.error(error?.message ?? "Could not start chat");
    navigate({ to: "/inbox/$id", params: { id: cid as string } });
  };

  if (isLoading) return <MobileShell><div className="px-5 pt-20 text-sm text-muted-foreground">Loading…</div></MobileShell>;
  if (!data) return (
    <MobileShell>
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
        <div className="font-display text-xl font-bold">User not found</div>
        <Link to="/discover" className="mt-4 text-sm text-primary">Discover creators →</Link>
      </div>
    </MobileShell>
  );

  const { profile, followers, following, videos, isFollowing } = data;
  const isSelf = user?.id === profile.id;

  return (
    <MobileShell>
      <div className="relative">
        <button onClick={() => history.back()} className="glass absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {profile.cover_url
          ? <img src={profile.cover_url} className="h-40 w-full object-cover" alt="" />
          : <div className="bg-gradient-primary h-40 w-full opacity-80" />}
        <div className="px-5 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-elegant" alt="" />
              : <div className="bg-gradient-primary h-24 w-24 rounded-full border-4 border-background shadow-elegant" />}
            {!isSelf && (
              <ReportDialog targetType="user" targetId={profile.id}>
                <button className="glass rounded-full p-2"><Flag className="h-4 w-4" /></button>
              </ReportDialog>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">@{profile.handle}</h1>
            {profile.is_verified && <BadgeCheck className="h-5 w-5 fill-accent text-background" />}
          </div>
          <div className="text-sm text-foreground">{profile.display_name}</div>
          {profile.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
            {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-accent"><LinkIcon className="h-3 w-3" />{profile.website.replace(/^https?:\/\//, "")}</a>}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat n={followers} label="Followers" />
            <Stat n={following} label="Following" />
            <Stat n={videos.length} label="Videos" />
          </div>

          {!isSelf && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={toggleFollow}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition ${
                  isFollowing
                    ? "glass text-foreground"
                    : "bg-gradient-primary text-primary-foreground shadow-glow"
                }`}
              >
                {isFollowing ? <><UserCheck className="h-4 w-4" /> Following</> : <><UserPlus className="h-4 w-4" /> Follow</>}
              </button>
              <button
                onClick={startMessage}
                className="bg-gradient-gold flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-background shadow-glow active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" /> Message
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5">
        {videos.length === 0 ? (
          <div className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">No videos yet.</div>
        ) : (
          <div className="mb-3 grid grid-cols-3 gap-1">
            {videos.map((v: any) => (
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
