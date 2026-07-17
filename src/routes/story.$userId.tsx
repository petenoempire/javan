import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, BadgeCheck, Trash2, Volume2, VolumeX, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markStoryViewed, deleteStory, getStoryViewers, type Story, type StoryAuthor } from "@/lib/stories";
import { toast } from "sonner";

export const Route = createFileRoute("/story/$userId")({
  head: () => ({ meta: [{ title: "Story · Javan" }] }),
  component: StoryViewer,
});

async function loadReel(userId: string): Promise<{ stories: Story[]; author: StoryAuthor | null }> {
  const { data: rows } = await supabase
    .from("stories")
    .select("id,user_id,media_url,media_type,caption,created_at,expires_at")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  const { data: prof } = await supabase
    .from("public_profiles")
    .select("id,handle,display_name,avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return { stories: (rows ?? []) as Story[], author: (prof as StoryAuthor) ?? null };
}

/** Get the next user_id in the tray order, so finishing one reel advances to the next person. */
async function getNextUserId(currentUserId: string): Promise<string | null> {
  const { data: rows } = await supabase
    .from("stories")
    .select("user_id, created_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) return null;
  const uniqueUserIds = [...new Set(rows.map((r: any) => r.user_id))];
  const currentIndex = uniqueUserIds.indexOf(currentUserId);
  if (currentIndex === -1 || currentIndex === uniqueUserIds.length - 1) return null;
  return uniqueUserIds[currentIndex + 1];
}

function StoryViewer() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showViewers, setShowViewers] = useState(false);

  const { data } = useQuery({
    queryKey: ["story-reel", userId],
    queryFn: () => loadReel(userId),
  });

  const stories = data?.stories ?? [];
  const author = data?.author;
  const current = stories[idx];
  const isOwner = user?.id === userId;
  const timerRef = useRef<number | null>(null);

  const { data: viewers = [] } = useQuery({
    queryKey: ["story-viewers", current?.id],
    queryFn: () => getStoryViewers(current!.id),
    enabled: isOwner && !!current && showViewers,
  });

  useEffect(() => {
    setProgress(0);
    if (!current) return;
    if (user && !isOwner) markStoryViewed(current.id, user.id).catch(() => {});
  }, [current?.id, user?.id, isOwner]);

  const goToNextPerson = async () => {
    const nextUserId = await getNextUserId(userId);
    if (nextUserId) {
      navigate({ to: "/story/$userId", params: { userId: nextUserId } });
    } else {
      navigate({ to: "/" });
    }
  };

  useEffect(() => {
    if (!current || paused || showViewers) return;
    const duration = current.media_type === "video" ? 15000 : 6000;
    const tick = 50;
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + (tick / duration) * 100;
        if (next >= 100) {
          window.clearInterval(timerRef.current!);
          if (idx < stories.length - 1) setIdx(idx + 1);
          else goToNextPerson();
          return 0;
        }
        return next;
      });
    }, tick);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [current?.id, paused, idx, stories.length, showViewers]);

  const handleDelete = async () => {
    if (!current) return;
    const toastId = toast.loading("Deleting story...");
    try {
      const { error } = await deleteStory(current.id);
      if (error) throw error;
      toast.success("Story deleted", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["story-tray"] });
      if (stories.length <= 1) {
        navigate({ to: "/" });
      } else if (idx < stories.length - 1) {
        queryClient.invalidateQueries({ queryKey: ["story-reel", userId] });
      } else {
        setIdx(Math.max(0, idx - 1));
        queryClient.invalidateQueries({ queryKey: ["story-reel", userId] });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete", { id: toastId });
    }
  };

  if (!current) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black text-white/70">
        <div className="text-center">
          <p className="text-sm">No active stories</p>
          <Link to="/" className="mt-3 inline-block rounded-full bg-white/10 px-4 py-2 text-xs">Back to feed</Link>
        </div>
      </div>
    );
  }

  const prev = () => (idx > 0 ? setIdx(idx - 1) : navigate({ to: "/" }));
  const next = () => (idx < stories.length - 1 ? setIdx(idx + 1) : goToNextPerson());

  return (
    <div className="fixed inset-0 z-50 bg-black text-white select-none">
      {current.media_type === "video" ? (
        <video
          key={current.id}
          src={current.media_url}
          autoPlay
          playsInline
          muted={muted}
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : (
        <img src={current.media_url} alt="" className="absolute inset-0 h-full w-full object-contain" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Progress bars */}
      <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
        {stories.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white transition-[width] duration-75"
              style={{ width: `${i < idx ? 100 : i === idx ? progress : 0}%` }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute inset-x-3 top-7 z-20 flex items-center justify-between pt-1">
        {author && (
          <Link to="/u/$handle" params={{ handle: author.handle }} className="flex items-center gap-2 active:opacity-80">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/40 object-cover" />
            ) : (
              <div className="bg-gradient-primary h-8 w-8 rounded-full border border-white/40" />
            )}
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">@{author.handle}</span>
            </div>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {current.media_type === "video" && (
            <button
              onClick={() => setMuted((m) => !m)}
              className="rounded-full bg-black/40 p-1.5 active:scale-90"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="rounded-full bg-black/40 p-1.5 active:scale-90"
              aria-label="Delete story"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
            </button>
          )}
          <button onClick={() => navigate({ to: "/" })} aria-label="Close" className="rounded-full bg-black/40 p-1.5 active:scale-90">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tap zones */}
      <button onClick={prev} className="absolute inset-y-0 left-0 z-0 w-1/3" aria-label="Previous" />
      <button onClick={next} className="absolute inset-y-0 right-0 z-0 w-1/3" aria-label="Next" />
      <button
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
        className="absolute inset-y-0 left-1/3 z-0 w-1/3"
        aria-label="Pause"
      />

      {current.caption && (
        <div className="absolute inset-x-4 bottom-20 z-10 text-center text-sm font-medium leading-snug drop-shadow">
          {current.caption}
        </div>
      )}

      {/* Viewer count (owner only) */}
      {isOwner && (
        <button
          onClick={() => setShowViewers(true)}
          className="absolute inset-x-4 bottom-6 z-20 flex items-center justify-center gap-1.5 text-xs font-bold text-white/70 active:scale-95"
        >
          <Eye className="h-3.5 w-3.5" />
          Viewed by {viewers.length > 0 || showViewers ? viewers.length : "..."}
        </button>
      )}

      {/* Viewer list sheet */}
      {showViewers && (
        <div
          className="absolute inset-0 z-30 flex items-end bg-black/60"
          onClick={() => setShowViewers(false)}
        >
          <div
            className="w-full max-h-[60vh] overflow-y-auto rounded-t-3xl bg-neutral-950 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-sm">Viewed by {viewers.length}</h3>
              <button onClick={() => setShowViewers(false)} className="text-white/50">
                <X className="h-5 w-5" />
              </button>
            </div>
            {viewers.length === 0 ? (
              <p className="py-6 text-center text-xs text-white/40">No views yet</p>
            ) : (
              <div className="space-y-3">
                {viewers.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-2">
                    {v.avatar_url ? (
                      <img src={v.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="bg-gradient-primary h-8 w-8 rounded-full" />
                    )}
                    <span className="text-sm font-semibold">@{v.handle}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nav hints */}
      <div className="pointer-events-none absolute left-2 top-1/2 z-0 -translate-y-1/2 text-white/30">
        <ChevronLeft className="h-6 w-6" />
      </div>
      <div className="pointer-events-none absolute right-2 top-1/2 z-0 -translate-y-1/2 text-white/30">
        <ChevronRight className="h-6 w-6" />
      </div>
    </div>
  );
}
