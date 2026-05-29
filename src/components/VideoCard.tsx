import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Music2, BadgeCheck, Volume2, VolumeX, Flag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import type { FeedVideo } from "@/lib/types";

function fmt(n: number) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

export function VideoCard({
  video,
  active,
  onComment,
  onShare,
  onReport,
}: {
  video: FeedVideo;
  active: boolean;
  onComment: () => void;
  onShare: () => void;
  onReport: () => void;
}) {
  const { user } = useAuth();
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(video.liked_by_me);
  const [likeCount, setLikeCount] = useState(video.like_count);
  const [muted, setMuted] = useState(true);
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else { el.pause(); el.currentTime = 0; }
  }, [active]);

  const toggleLike = async () => {
    if (!user) { toast.info("Sign in to like videos"); return; }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (next) setBursts((b) => [...b, Date.now()]);
    if (next) {
      const { error } = await supabase.from("video_likes").insert({ video_id: video.id, user_id: user.id });
      if (error && !error.message.includes("duplicate")) {
        setLiked(false); setLikeCount((c) => c - 1); toast.error(error.message);
      }
    } else {
      await supabase.from("video_likes").delete().eq("video_id", video.id).eq("user_id", user.id);
    }
  };

  return (
    <div className="relative h-[100dvh] w-full snap-start overflow-hidden bg-black">
      <video
        ref={ref}
        src={video.video_url}
        poster={video.thumbnail_url ?? undefined}
        playsInline
        loop
        muted={muted}
        onDoubleClick={toggleLike}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      <AnimatePresence>
        {bursts.map((id) => (
          <motion.div
            key={id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.6, 1], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            onAnimationComplete={() => setBursts((b) => b.filter((x) => x !== id))}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px]"
          >❤️</motion.div>
        ))}
      </AnimatePresence>

      <div className="absolute bottom-32 right-3 z-10 flex flex-col items-center gap-5 text-white">
        {video.author.avatar_url ? (
          <img src={video.author.avatar_url} alt="" className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-glow" />
        ) : (
          <div className="bg-gradient-primary h-12 w-12 rounded-full border-2 border-white shadow-glow" />
        )}
        <button onClick={toggleLike} className="flex flex-col items-center gap-1 active:scale-90" aria-label="Like">
          <div className={`glass flex h-12 w-12 items-center justify-center rounded-full ${liked ? "heart-burst" : ""}`}>
            <Heart className={`h-7 w-7 ${liked ? "fill-rose text-rose" : "text-white"}`} />
          </div>
          <span className="text-xs font-semibold">{fmt(likeCount)}</span>
        </button>
        <button onClick={onComment} className="flex flex-col items-center gap-1 active:scale-90" aria-label="Comment">
          <div className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-xs font-semibold">{fmt(video.comment_count)}</span>
        </button>
        <button onClick={onShare} className="flex flex-col items-center gap-1 active:scale-90" aria-label="Share">
          <div className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <Share2 className="h-7 w-7 text-white" />
          </div>
        </button>
        <button onClick={onReport} className="flex flex-col items-center gap-1 active:scale-90" aria-label="Report">
          <div className="glass flex h-10 w-10 items-center justify-center rounded-full">
            <Flag className="h-5 w-5 text-white" />
          </div>
        </button>
        <button onClick={() => setMuted((m) => !m)} className="active:scale-90" aria-label="Mute">
          <div className="glass flex h-10 w-10 items-center justify-center rounded-full">
            {muted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
          </div>
        </button>
      </div>

      <div className="absolute bottom-28 left-4 right-20 z-10 text-white">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-display text-lg font-semibold">@{video.author.handle}</span>
          {video.author.is_verified && <BadgeCheck className="h-4 w-4 fill-accent text-background" />}
        </div>
        {video.caption && <p className="mb-3 text-sm leading-snug opacity-95">{video.caption}</p>}
        {video.music && (
          <div className="flex items-center gap-2 text-xs opacity-80">
            <Music2 className="h-3.5 w-3.5" />
            <span className="truncate">{video.music}</span>
          </div>
        )}
      </div>
    </div>
  );
}
