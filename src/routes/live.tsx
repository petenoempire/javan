import { createFileRoute, Link } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Radio, Eye, Users, Heart } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveLiveStreams } from "@/lib/live";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Watch Live Streams & Connect with Creators · Javan" },
      { name: "description", content: "Experience real-time entertainment on Javan. Watch live streams from your favorite creators, interact in real-time, and join a global community of fans." },
      { property: "og:title", content: "Watch Live Streams & Connect with Creators · Javan" },
      { property: "og:description", content: "Experience real-time entertainment. Watch live streams from your favorite creators and join the conversation on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/live" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Watch Live Streams & Connect with Creators · Javan" },
      { name: "twitter:description", content: "Watch and interact with creators in real-time on Javan." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/live" }],
  }),
  component: LivePage,
});

function LivePage() {
  const isDesktop = useIsDesktop();

  const { data: liveStreams = [], isLoading } = useQuery({
    queryKey: ["active-live-streams"],
    queryFn: fetchActiveLiveStreams,
    refetchInterval: 10000,
  });

  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-glow">
                <Radio className="h-8 w-8 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-chrome tracking-tight">LIVE Feed</h1>
                <p className="text-white/50">Watch active creators streaming live right now.</p>
              </div>
            </div>
            <Link to="/create" search={{ mode: "live" }} className="bg-gradient-live px-6 py-3 rounded-2xl text-sm font-bold shadow-glow live-pulse text-white">
              Go Live
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[9/16] rounded-3xl glass animate-pulse" />
              ))}
            </div>
          ) : liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {liveStreams.map((stream: any) => (
                <Link key={stream.id} to="/live/$id" params={{ id: stream.id }} search={{ host: undefined }} className="group cursor-pointer">
                  <div className="relative aspect-[9/16] rounded-3xl overflow-hidden glass border border-white/10 mb-4 bg-black/60 shadow-lg">
                     <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <span className="bg-rose-600 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg animate-pulse text-white">LIVE</span>
                        <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 text-white">
                          <Eye className="h-3 w-3 text-rose-400" /> {stream.viewer_count || 1}
                        </span>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity z-10"></div>
                     <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10 border-2 border-rose-500 shadow-glow">
                            <AvatarImage src={stream.host?.avatar_url} />
                            <AvatarFallback>{stream.host?.display_name?.[0] || "C"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white/70 truncate">@{stream.host?.handle || "creator"}</p>
                            <h2 className="text-sm font-black line-clamp-1 text-white group-hover:text-rose-400 transition-colors">{stream.title || "Live Stream"}</h2>
                          </div>
                        </div>
                     </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center glass rounded-3xl border border-white/5 flex flex-col items-center justify-center">
              <Radio className="h-12 w-12 text-rose-500/30 mb-4 animate-pulse" />
              <p className="text-white/60 font-bold text-lg mb-2">No live streams right now</p>
              <p className="text-white/40 text-sm mb-6 max-w-sm">Be the first to start a live broadcast and connect with your audience in real-time!</p>
              <Link to="/create" search={{ mode: "live" }} className="bg-gradient-live px-6 py-3 rounded-2xl text-sm font-bold shadow-glow text-white">
                Start Broadcasting
              </Link>
            </div>
          )}
        </div>
      </DesktopLayout>

      {isDesktop === false && (
      <MobileShell>
        <div className="px-4 pt-4 pb-24">
           <div className="flex items-center justify-between mb-4">
             <h1 className="text-2xl font-black text-chrome">LIVE</h1>
             <Link to="/create" search={{ mode: "live" }} className="bg-gradient-live px-4 py-1.5 rounded-full text-xs font-bold shadow-glow text-white">
               Go Live
             </Link>
           </div>
           <div className="space-y-4">
              {isLoading ? (
                <div className="aspect-[9/16] rounded-3xl glass animate-pulse" />
              ) : liveStreams.length > 0 ? (
                liveStreams.map((stream: any) => (
                  <Link key={stream.id} to="/live/$id" params={{ id: stream.id }} search={{ host: undefined }} className="relative block aspect-[9/16] rounded-3xl bg-black/50 border border-white/10 overflow-hidden shadow-2xl">
                     <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <span className="bg-rose-600 text-[9px] font-black px-2.5 py-1 rounded-md shadow-lg animate-pulse text-white">LIVE</span>
                        <span className="bg-black/60 backdrop-blur-md text-[9px] font-bold px-2 py-1 rounded-md flex items-center gap-1 text-white">
                          <Eye className="h-3 w-3 text-rose-400" /> {stream.viewer_count || 1}
                        </span>
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                     <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10 border-2 border-rose-500">
                            <AvatarImage src={stream.host?.avatar_url} />
                            <AvatarFallback>{stream.host?.display_name?.[0] || "C"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white/70 truncate">@{stream.host?.handle || "creator"}</p>
                            <h2 className="text-base font-black line-clamp-1 text-white">{stream.title || "Live Stream"}</h2>
                          </div>
                        </div>
                     </div>
                  </Link>
                ))
              ) : (
                <div className="py-20 text-center glass rounded-3xl border border-white/5 px-6">
                  <Radio className="h-10 w-10 text-rose-500/30 mx-auto mb-3 animate-pulse" />
                  <p className="text-white/60 font-bold mb-1">No active live streams</p>
                  <p className="text-white/40 text-xs mb-6">Tap Go Live above to start broadcasting!</p>
                  <Link to="/create" search={{ mode: "live" }} className="inline-block bg-gradient-live px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-glow">
                    Go Live Now
                  </Link>
                </div>
              )}
           </div>
        </div>
      </MobileShell>
      )}
    </>
  );
}
