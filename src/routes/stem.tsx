import { createFileRoute } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Microscope, Brain, Rocket, Atom } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export const Route = createFileRoute("/stem")({
  head: () => ({
    meta: [
      { title: "STEM Hub — Educational Short Videos & Insights · Javan" },
      { name: "description", content: "Learn something new every day. Explore short videos focused on Science, Technology, Engineering, and Math from expert creators on the Javan STEM Hub." },
      { property: "og:title", content: "STEM Hub — Educational Short Videos & Insights · Javan" },
      { property: "og:description", content: "Learn something new every day. Explore short videos focused on Science, Technology, Engineering, and Math from expert creators." },
      { property: "og:url", content: "https://javan.lovable.app/stem" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "STEM Hub — Educational Short Videos & Insights · Javan" },
      { name: "twitter:description", content: "Explore educational science and tech content on Javan." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/stem" }],
  }),
  component: StemPage,
});

function StemPage() {
  const isDesktop = useIsDesktop();
  const categories = [
    { icon: Microscope, label: "Science", color: "text-blue-400" },
    { icon: Brain, label: "Technology", color: "text-purple-400" },
    { icon: Rocket, label: "Engineering", color: "text-orange-400" },
    { icon: Atom, label: "Mathematics", color: "text-cyan-400" },
  ];

  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <Microscope className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-chrome tracking-tight">Javan STEM Hub</h1>
              <p className="text-white/50">Educational content and deep dives into science and tech.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {categories.map((cat) => (
              <div key={cat.label} className="glass p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer">
                <cat.icon className={`h-10 w-10 ${cat.color} mb-4 group-hover:scale-110 transition-transform`} />
                <h2 className="text-sm font-bold">{cat.label}</h2>
                <p className="text-xs text-white/40 mt-1">1.2K creators</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/5">
              <p className="text-white/40">No STEM content available yet.</p>
            </div>
          </div>
        </div>
      </DesktopLayout>

      {isDesktop === false && (
      <MobileShell>
        <div className="px-5 pt-4 pb-20">
           <h1 className="text-2xl font-black text-chrome mb-6">STEM</h1>
           <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div key={cat.label} className="glass p-4 rounded-2xl border border-white/5">
                  <cat.icon className={`h-6 w-6 ${cat.color} mb-2`} />
                  <p className="text-sm font-bold">{cat.label}</p>
                </div>
              ))}
           </div>
	           <div className="mt-8 space-y-6 text-center py-10">
	              <p className="text-white/20 italic">No content found.</p>
	           </div>
        </div>
      </MobileShell>
      )}
    </>
  );
}
