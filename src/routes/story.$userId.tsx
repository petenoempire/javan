import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { markStoryViewed, type Story, type StoryAuthor } from "@/lib/stories";

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
    .from("profiles")
    .select("id,handle,display_name,avatar_url,is_verified")
    .eq("id", userId)
    .maybeSingle();
  return { stories: (rows ?? []) as Story[], author: (prof as StoryAuthor) ?? null };
}

function StoryViewer() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data } = useQuery({
    queryKey: ["story-reel", userId],
    queryFn: () => loadReel(userId),
  });

  const stories = data?.stories ?? [];
  const author = data?.author;
  const current = stories[idx];
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setProgress(0);
    if (!current) return;
    if (user) markStoryViewed(current.id, user.id).catch(() => {});
  }, [current?.id, user?.id]);

  useEffect(() => {
    if (!current || paused) return;
    const duration = current.media_type === "video" ? 15000 : 6000;
    const tick = 50;
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + (tick / duration) * 100;
        if (next >= 100) {
          window.clearInterval(timerRef.current!);
          if (idx < stories.length - 1) setIdx(idx + 1);
          else navigate({ to: "/" });
          return 0;
        }
        return next;
      });
    }, tick);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [current?.id, paused, idx, stories.length]);

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
  const next = () => (idx < stories.length - 1 ? setIdx(idx + 1) : navigate({ to: "/" }));

  return (
    <div className="fixed inset-0 z-50 bg-black text-white select-none">
      {current.media_type === "video" ? (
        <video src={current.media_url} autoPlay playsInline muted={false} className="absolute inset-0 h-full w-full object-contain" />
      ) : (
        <img src={current.media_url} alt="" className="absolute inset-0 h-full w-full object-contain" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Progress bars */}
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
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
      <div className="absolute inset-x-3 top-7 z-10 flex items-center justify-between pt-1">
        {author && (
          <Link to="/u/$handle" params={{ handle: author.handle }} className="flex items-center gap-2 active:opacity-80">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/40 object-cover" />
            ) : (
              <div className="bg-gradient-primary h-8 w-8 rounded-full border border-white/40" />
            )}
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold">@{author.handle}</span>
              {author.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-accent" />}
            </div>
          </Link>
        )}
        <button onClick={() => navigate({ to: "/" })} aria-label="Close" className="rounded-full bg-black/40 p-1.5 active:scale-90">
          <X className="h-5 w-5" />
        </button>
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
        <div className="absolute inset-x-4 bottom-8 z-10 text-center text-sm font-medium leading-snug drop-shadow">
          {current.caption}
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
