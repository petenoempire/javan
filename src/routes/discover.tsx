import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { liveStreams, videos } from "@/lib/mock";
import { Search, Radio, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover · Admiralty" }] }),
  component: Discover,
});

function Discover() {
  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Discover</h1>
        <div className="glass mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input placeholder="Search creators, sounds, tags…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose" />
            <h2 className="font-display text-lg font-semibold">Live now</h2>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
            {liveStreams.map((s) => (
              <Link key={s.id} to="/live/$id" params={{ id: s.id }} className="relative w-44 shrink-0">
                <div className="relative h-60 overflow-hidden rounded-2xl shadow-elegant">
                  <img src={s.cover} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                  <span className="bg-gradient-live live-pulse absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                    ● LIVE
                  </span>
                  <div className="absolute bottom-2 left-2 right-2 text-white">
                    <div className="text-xs opacity-80">@{s.host.handle}</div>
                    <div className="line-clamp-2 text-sm font-semibold">{s.title}</div>
                    <div className="mt-1 text-[10px] opacity-90">{s.viewers.toLocaleString()} watching</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Trending</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {videos.map((v) => (
              <Link key={v.id} to="/" className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                <img src={v.poster} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="text-[10px] opacity-80">@{v.user.handle}</div>
                  <div className="line-clamp-1 text-xs font-medium">{v.caption}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
