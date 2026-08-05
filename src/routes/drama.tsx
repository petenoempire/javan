import { createFileRoute } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Film, Clapperboard, Star, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/drama")({
  head: () => ({
    meta: [
      { title: "Drama & Stories — The Latest Creator Updates · Javan" },
      { name: "description", content: "Catch up on the latest creator drama, exclusive stories, and behind-the-scenes content on Javan. Discover trending cinematic shorts and community narratives." },
      { property: "og:title", content: "Drama & Stories — The Latest Creator Updates · Javan" },
      { property: "og:description", content: "Catch up on the latest creator drama, exclusive stories, and behind-the-scenes content on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/drama" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Drama & Stories — The Latest Creator Updates · Javan" },
      { name: "twitter:description", content: "Watch the latest creator stories and drama on Javan." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/drama" }],
  }),
  component: DramaPage,
});

function DramaPage() {
  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <Film className="h-8 w-8 text-rose-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-chrome tracking-tight">Javan Drama & Stories</h1>
              <p className="text-white/50">The latest trending stories, cinematic shorts, and community drama.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
              <p className="text-white/40">No drama content available yet.</p>
            </div>
          </div>
        </div>
      </DesktopLayout>

	      <MobileShell>
	        <div className="px-5 pt-4 pb-20">
	           <h2 className="text-2xl font-black text-chrome mb-6">Drama</h2>
	           <div className="space-y-4 text-center py-10">
	              <p className="text-white/20 italic">No content found.</p>
	           </div>
	        </div>
	      </MobileShell>
    </>
  );
}
