import { createFileRoute, Link } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Radio, Eye, Users, Heart } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Now · Javan" },
      { name: "description", content: "Watch live streams from your favorite creators on Javan. Interact in real-time and join the community." },
      { property: "og:title", content: "Live Now · Javan" },
      { property: "og:description", content: "Watch live streams from your favorite creators on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/live" },
      { name: "twitter:title", content: "Live Now · Javan" },
      { name: "twitter:description", content: "Watch live streams from your favorite creators on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/live" }],
  }),
  component: LivePage,
});

function LivePage() {
  const liveStreams: any[] = [];

  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Radio className="h-8 w-8 text-rose-400" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-chrome tracking-tight">Live Now</h1>
                <p className="text-white/50">Watch and interact with creators in real-time.</p>
              </div>
            </div>
            <button className="bg-gradient-live px-6 py-3 rounded-2xl text-sm font-bold shadow-glow live-pulse">
              Go Live
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {liveStreams.length > 0 ? liveStreams.map((stream) => (
              <Link key={stream.id} to={`/live/${stream.id}`} className="group cursor-pointer">
                <div className="relative aspect-video rounded-3xl overflow-hidden glass border border-white/10 mb-4">
                   <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className="bg-rose-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg animate-pulse">LIVE</span>
                      <span className="bg-black/40 backdrop-blur-md text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {stream.viewers}
                      </span>
                   </div>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity z-10"></div>
                </div>
                <div className="flex gap-4 px-2">
                  <Avatar className="h-12 w-12 border-2 border-rose-500/30">
                    <AvatarFallback>{stream.host[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold line-clamp-1 group-hover:text-rose-400 transition-colors">{stream.title}</h3>
                    <p className="text-sm text-white/50 mt-1">@{stream.host} • {stream.category}</p>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
                <p className="text-white/40">No live streams at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </DesktopLayout>

      <MobileShell>
        <div className="px-5 pt-4 pb-20">
           <h1 className="text-2xl font-black text-chrome mb-6">Live</h1>
           <div className="space-y-6">
              {liveStreams.length > 0 ? liveStreams.map((stream) => (
                <Link key={stream.id} to={`/live/${stream.id}`} className="relative block aspect-[9/16] rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
                   <div className="absolute top-4 left-4 z-20 flex gap-2">
                      <span className="bg-rose-600 text-[8px] font-black px-2 py-0.5 rounded shadow-lg">LIVE</span>
                   </div>
                   <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-sm font-bold">{stream.title}</p>
                      <p className="text-[10px] text-white/60 mt-1">@{stream.host}</p>
                   </div>
                </Link>
              )) : (
                <p className="text-white/20 italic text-center py-10">No live streams found.</p>
              )}
           </div>
        </div>
      </MobileShell>
    </>
  );
}
