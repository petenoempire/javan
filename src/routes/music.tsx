import { createFileRoute } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Music as MusicIcon, Play, SkipBack, SkipForward, ListMusic, Volume2 } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export const Route = createFileRoute("/music")({
  head: () => ({
    meta: [
      { title: "Music Hub: Trending Sounds & Original Tracks · Javan" },
      { name: "description", content: "Discover trending music, original artist tracks, and viral sounds on Javan. Find the perfect sound for your next video in our creator music library." },
      { property: "og:title", content: "Music Hub: Trending Sounds & Original Tracks · Javan" },
      { property: "og:description", content: "Discover trending music, original artist tracks, and viral sounds on Javan. Find the perfect sound for your next video in our creator music library." },
      { property: "og:url", content: "https://javan.lovable.app/music" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Music Hub: Trending Sounds & Original Tracks · Javan" },
      { name: "twitter:description", content: "Discover trending music and original tracks for your content on Javan." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/music" }],
  }),
  component: MusicPage,
});

function MusicPage() {
  const isDesktop = useIsDesktop();
  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20">
              <MusicIcon className="h-8 w-8 text-fuchsia-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-chrome tracking-tight">Music Hub & Sounds</h1>
              <p className="text-white/50">Discover trending sounds, original tracks, and background music for your streams.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold">Trending Sounds</h2>
              <div className="space-y-2">
                <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
                  <p className="text-white/40">No trending sounds available yet.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <h2 className="text-xl font-bold">Now Playing</h2>
               <div className="glass p-6 rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center">
                  <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 mb-6 relative group overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                       <MusicIcon className="h-20 w-20 text-white/10 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">No track playing</h3>
                  <p className="text-xs text-white/40 mt-1">Select a sound to start listening</p>
               </div>
            </div>
          </div>
        </div>
      </DesktopLayout>

      {isDesktop === false && (
      <MobileShell>
        <div className="px-5 pt-4 pb-20">
           <h1 className="text-2xl font-black text-chrome mb-6">Music</h1>
	           <div className="space-y-4 text-center py-10">
	              <p className="text-white/20 italic">No sounds found.</p>
	           </div>
        </div>
      </MobileShell>
      )}
    </>
  );
}
