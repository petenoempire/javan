import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Music2, BadgeCheck, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { Video } from "@/lib/mock";

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
}: {
  video: Video;
  active: boolean;
  onComment: () => void;
  onShare: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(true);
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (active) el.play().catch(() => {});
    else { el.pause(); el.currentTime = 0; }
  }, [active]);

  const triggerLike = () => {
    setLiked(true);
    setBursts((b) => [...b, Date.now()]);
  };

  return (
    <div className="relative h-[100dvh] w-full snap-start overflow-hidden bg-black">
      <video
        ref={ref}
        src={video.src}
        poster={video.poster}
        playsInline
        loop
        muted={muted}
        onDoubleClick={triggerLike}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* gradients for legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* heart burst layer */}
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
          >
            ❤️
          </motion.div>
        ))}
      </AnimatePresence>

      {/* right actions */}
      <div className="absolute bottom-32 right-3 z-10 flex flex-col items-center gap-5 text-white">
        <img
          src={video.user.avatar}
          alt=""
          className="h-12 w-12 rounded-full border-2 border-white object-cover shadow-glow"
        />
        <button onClick={triggerLike} className="flex flex-col items-center gap-1 active:scale-90">
          <div className={`glass flex h-12 w-12 items-center justify-center rounded-full ${liked ? "heart-burst" : ""}`}>
            <Heart className={`h-7 w-7 ${liked ? "fill-rose text-rose" : "text-white"}`} />
          </div>
          <span className="text-xs font-semibold">{fmt(video.likes + (liked ? 1 : 0))}</span>
        </button>
        <button onClick={onComment} className="flex flex-col items-center gap-1 active:scale-90">
          <div className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-xs font-semibold">{fmt(video.comments)}</span>
        </button>
        <button onClick={onShare} className="flex flex-col items-center gap-1 active:scale-90">
          <div className="glass flex h-12 w-12 items-center justify-center rounded-full">
            <Share2 className="h-7 w-7 text-white" />
          </div>
          <span className="text-xs font-semibold">{fmt(video.shares)}</span>
        </button>
        <button onClick={() => setMuted((m) => !m)} className="active:scale-90">
          <div className="glass flex h-10 w-10 items-center justify-center rounded-full">
            {muted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
          </div>
        </button>
      </div>

      {/* bottom caption */}
      <div className="absolute bottom-28 left-4 right-20 z-10 text-white">
        <div className="mb-2 flex items-center gap-2">
          <span className="font-display text-lg font-semibold">@{video.user.handle}</span>
          {video.user.verified && <BadgeCheck className="h-4 w-4 fill-accent text-background" />}
        </div>
        <p className="mb-3 text-sm leading-snug opacity-95">{video.caption}</p>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Music2 className="h-3.5 w-3.5" />
          <span className="truncate">{video.music}</span>
        </div>
      </div>
    </div>
  );
}
