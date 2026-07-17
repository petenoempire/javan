import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, MapPin, MessageCircle, UserPlus, UserCheck, Flag, Film, Music2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/ReportDialog";

export const Route = createFileRoute("/u/$handle")({
  head: ({ params }) => ({ meta: [{ title: `@${params.handle} · Javan` }] }),
  component: PublicProfile,
});

function PublicProfile() {
  const { handle } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [tab, setTab] = useState<"posts" | "music">("posts");
  const [playingId, setPlayingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-profile", handle, user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("public_profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();
      if (!profile) return null;

      const [{ count: followers }, { count: following }, { data: posts }, { data: artistProfile }] = await Promise.all([
        supabase.from("followers").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("followers").select("following_id", { count: "exact", head: true }).eq("follower_id", profile.id),
        supabase.from("posts").select("id,video_url,image_url,media_type,content").eq("user_id", profile.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("is_artist").eq("id", profile.id).maybeSingle(),
      ]);

      let tracks: any[] = [];
      const isArtist = !!artistProfile?.is_artist;
      if (isArtist) {
        const { data: trackRows } = await supabase
          .from("tracks")
          .select("id,title,audio_url,cover_url,plays_count")
          .eq("artist_id", profile.id)
          .order("created_at", { ascending: false });
        tracks = trackRows ?? [];
      }

      let isFollowing = false;
      if (user && user.id !== profile.id) {
        const { data: f } = await supabase
          .from("followers")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle();
        isFollowing = !!f;
      }

      return {
        profile,
        followers: followers ?? 0,
        following: following ?? 0,
        posts: posts ?? [],
        tracks,
        isArtist,
        isFollowing,
      };
    },
  });

  const toggleFollow = async () => {
    if (!user) return navigate({ to: "/auth" });
    if (!data?.profile || user.id === data.profile.id) return;
    if (data.isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", data.profile.id);
    } else {
      const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: data.profile.id });
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["public-profile", handle] });
  };

  const togglePlay = (track: any) => {
    if (playingId === track.id) {
      setPlayingId(null);
      return;
    }
    const audio = new Audio(track.audio_url);
    audio.play();
    audio.onended = () => setPlayingId(null);
    setPlayingId(track.id);
  };

  if (isLoading) {
    return (
      <MobileShell>
        <div className="px-5 pt-20 text-sm text-muted-foreground">Loading...</div>
      </MobileShell>
    );
  }

  if (!data) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <div className="font-display text-xl font-bold">User not found</div>
          <Link to="/" className="mt-4 text-sm text-primary">Back to feed →</Link>
        </div>
      </MobileShell>
    );
  }

  const { profile, followers, following, posts, tracks, isArtist, isFollowing } = data;
  const isSelf = user?.id === profile.id;

  return (
    <MobileShell>
      <div className="relative">
        <button onClick={() => history.back()} className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="bg-gradient-to-r from-fuchsia-600 to-rose-600 h-32 w-full opacity-80" />
        <div className="px-5 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} className="h-24 w-24 rounded-full border-4 border-black object-cover" alt="" />
            ) : (
              <div className="bg-gradient-to-r from-rose-500 to-fuchsia-500 h-24 w-24 rounded-full border-4 border-black" />
            )}
            {!isSelf && (
              <>
                <button onClick={() => setReportOpen(true)} className="rounded-full bg-white/10 p-2">
                  <Flag className="h-4 w-4" />
                </button>
                <ReportDialog target={reportOpen ? { type: "user", id: profile.id } : null} onClose={() => setReportOpen(false)} />
              </>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white">@{profile.handle}</h1>
            {isArtist && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                <Music2 className="h-3 w-3" /> Artist
              </span>
            )}
          </div>
          <div className="text-sm text-white/80">{profile.display_name}</div>
          {profile.bio && <p className="mt-2 text-sm text-white/60">{profile.bio}</p>}
          {profile.country && (
            <div className="mt-2 flex items-center gap-1 text-xs text-white/50">
              <MapPin className="h-3 w-3" />
              {profile.country}
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat n={followers} label="Followers" />
            <Stat n={following} label="Following" />
            <Stat n={posts.length} label="Posts" />
          </div>

          {!isSelf && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={toggleFollow}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition ${
                  isFollowing ? "bg-white/10 text-white" : "bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Follow
                  </>
                )}
              </button>
              <button className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3.5 text-sm font-bold text-white">
                <MessageCircle className="h-4 w-4" /> Message
              </button>
            </div>
          )}
        </div>
      </div>

      {isArtist && (
        <div className="mx-5 mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-white/5 p-1">
          <button
            onClick={() => setTab("posts")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
              tab === "posts" ? "bg-white/10 text-white" : "text-white/50"
            }`}
          >
            <Film className="h-4 w-4" /> Posts
          </button>
          <button
            onClick={() => setTab("music")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition ${
              tab === "music" ? "bg-white/10 text-white" : "text-white/50"
            }`}
          >
            <Music2 className="h-4 w-4" /> Music ({tracks.length})
          </button>
        </div>
      )}

      <div className="px-5 pb-8">
        {tab === "music" && isArtist ? (
          tracks.length === 0 ? (
            <div className="rounded-3xl bg-white/5 p-8 text-center text-sm text-white/50">No tracks yet.</div>
          ) : (
            <div className="space-y-2">
              {tracks.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  {t.cover_url ? (
                    <img src={t.cover_url} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-rose-600">
                      <Music2 className="h-4 w-4 text-white/80" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-white">{t.title}</p>
                    <p className="text-[10px] text-white/40">{t.plays_count} plays</p>
                  </div>
                  <button onClick={() => togglePlay(t)} className="rounded-full bg-white/10 p-2 active:scale-90">
                    {playingId === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )
        ) : posts.length === 0 ? (
          <div className="rounded-3xl bg-white/5 p-8 text-center text-sm text-white/50">No posts yet.</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {posts.map((p: any) => (
              <Link
                key={p.id}
                to={`/posts/${p.id}`}
                className="relative aspect-[3/4] overflow-hidden rounded-md bg-white/5"
              >
                {p.media_type === "image" && p.image_url ? (
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                ) : p.video_url ? (
                  <video src={p.video_url} className="h-full w-full object-cover" muted />
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="font-display text-lg font-bold text-white">{n.toLocaleString()}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
    </div>
  );
}
