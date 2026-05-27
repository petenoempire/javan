import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { videos } from "@/lib/mock";
import { Settings, Share2, Wallet, BarChart3, BadgeCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · Admiralty" }] }),
  component: Profile,
});

function Profile() {
  return (
    <MobileShell>
      <div className="relative">
        <div className="bg-gradient-primary h-40 w-full opacity-80" />
        <div className="px-5 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <img src="https://i.pravatar.cc/240?u=you" className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-elegant" alt="" />
            <div className="flex gap-2">
              <button className="glass rounded-full p-2"><Share2 className="h-4 w-4" /></button>
              <button className="glass rounded-full p-2"><Settings className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold">@you</h1>
            <BadgeCheck className="h-5 w-5 fill-accent text-background" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Building something premium · NYC ↔ Tokyo</p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { v: "1.2M", l: "Followers" },
              { v: "412", l: "Following" },
              { v: "24.8M", l: "Likes" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl p-3">
                <div className="font-display text-lg font-bold">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/wallet" className="bg-gradient-primary flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground shadow-glow">
              <Wallet className="h-4 w-4" /> Wallet
            </Link>
            <Link to="/admin" className="glass flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold">
              <BarChart3 className="h-4 w-4" /> Owner panel
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5">
        <div className="mb-3 grid grid-cols-3 gap-1">
          {videos.concat(videos).map((v, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-md">
              <img src={v.poster} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
