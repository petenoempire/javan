import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { VideoCard } from "@/components/VideoCard";
import { CommentDrawer } from "@/components/CommentDrawer";
import { videos } from "@/lib/mock";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admiralty — For You" },
      { name: "description", content: "Your endless feed of culture, sound and creators on Admiralty." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [activeIdx, setActiveIdx] = useState(0);
  const [comments, setComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.idx);
            setActiveIdx(i);
          }
        });
      },
      { root: el, threshold: 0.7 },
    );
    el.querySelectorAll("[data-idx]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <MobileShell immersive>
      {/* tabs */}
      <div className="absolute left-1/2 top-4 z-40 flex -translate-x-1/2 gap-6 text-sm font-semibold text-white">
        {(["following", "foryou"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative px-1 py-1">
            <span className={tab === t ? "text-white" : "text-white/60"}>
              {t === "foryou" ? "For You" : "Following"}
            </span>
            {tab === t && (
              <motion.div layoutId="feed-tab" className="bg-gradient-primary mx-auto mt-1 h-0.5 w-6 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="no-scrollbar h-[100dvh] snap-y snap-mandatory overflow-y-scroll"
      >
        {videos.map((v, i) => (
          <div key={v.id} data-idx={i}>
            <VideoCard
              video={v}
              active={i === activeIdx}
              onComment={() => setComments(true)}
              onShare={() => navigator.share?.({ title: v.caption, url: location.href }).catch(() => {})}
            />
          </div>
        ))}
      </div>

      <CommentDrawer open={comments} onClose={() => setComments(false)} />
    </MobileShell>
  );
}
