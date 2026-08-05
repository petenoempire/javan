import { createFileRoute } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { TrendingUp, Flame, Trophy, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "Trending Now on Javan — Viral Short Videos & Top Creators" },
      { name: "description", content: "Stay updated with what's viral. See the most popular short videos, top creators, and trending topics on Javan today. Join the conversation and see what's trending in real-time." },
      { property: "og:title", content: "Trending Now on Javan — Viral Short Videos & Top Creators" },
      { property: "og:description", content: "Stay updated with what's viral on Javan. See popular short videos, top creators, and trending topics." },
      { property: "og:url", content: "https://javan.lovable.app/trending" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Trending Now on Javan — Viral Short Videos & Top Creators" },
      { name: "twitter:description", content: "Discover what's viral on Javan right now." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/trending" }],
  }),
  component: TrendingPage,
});

function TrendingPage() {
  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-chrome tracking-tight">Trending Now on Javan</h1>
              <p className="text-white/50">The hottest creators, videos, and topics across the cosmic Javan universe.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-orange-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                   <Flame className="h-5 w-5 text-orange-500" />
                   <h2 className="font-bold">Hot Creators</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-xs text-white/20 italic">No data yet.</p>
                </div>
             </div>
             <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-cyan-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                   <Trophy className="h-5 w-5 text-cyan-500" />
                   <h2 className="font-bold">Top Earners</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-xs text-white/20 italic">No data yet.</p>
                </div>
             </div>
             <div className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/5 to-transparent">
                <div className="flex items-center gap-3 mb-4">
                   <BarChart3 className="h-5 w-5 text-purple-500" />
                   <h2 className="font-bold">Viral Topics</h2>
                </div>
                <div className="space-y-4">
                   <p className="text-xs text-white/20 italic">No topics yet.</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
              <p className="text-white/40">No trending videos found.</p>
            </div>
          </div>
        </div>
      </DesktopLayout>

      <MobileShell>
        <div className="px-5 pt-4 pb-20">
           <h1 className="text-2xl font-black text-chrome mb-6">Trending</h1>
           <div className="space-y-4 text-center py-10">
              <p className="text-white/20 italic">No trending content found.</p>
           </div>
        </div>
      </MobileShell>
    </>
  );
}
