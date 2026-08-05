import { createFileRoute } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Users, MessageSquare, Shield, Globe } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Javan Community — Connect, Share & Grow with Creators" },
      { name: "description", content: "Join the conversation on Javan. Connect with other creators, join groups, and share your passion on the most interactive short video platform community." },
      { property: "og:title", content: "Javan Community — Connect, Share & Grow with Creators" },
      { property: "og:description", content: "Join the conversation. Connect with other creators, join groups, and share your passion on the Javan community platform." },
      { property: "og:url", content: "https://javan.lovable.app/community" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Javan Community — Connect, Share & Grow with Creators" },
      { name: "twitter:description", content: "Join your tribe and connect with creators on Javan." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/community" }],
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const isDesktop = useIsDesktop();
  const groups = [
    { name: "Global Creators", members: "2.4M", color: "bg-blue-500" },
    { name: "Tech Pioneers", members: "850K", color: "bg-purple-500" },
    { name: "Artist Alley", members: "1.1M", color: "bg-rose-500" },
    { name: "Live Streamers", members: "3.2M", color: "bg-orange-500" },
  ];

  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-chrome tracking-tight">Javan Community</h1>
              <p className="text-white/50">Join groups, participate in discussions, and find your tribe.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {groups.map((group) => (
              <div key={group.name} role="button" aria-label={`Join ${group.name} group`} tabIndex={0} className="glass p-6 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl ${group.color} flex items-center justify-center shadow-lg`}>
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">{group.name}</h3>
                    <p className="text-xs text-white/40">{group.members} members</p>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold hover:bg-white/20 transition-colors">
                  Join
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold">Recent Discussions</h2>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass p-6 rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-white/10"></div>
                  <span className="text-sm font-bold">@User_{i}</span>
                  <span className="text-xs text-white/40">2 hours ago</span>
                </div>
                <p className="text-sm text-white/80">What are the best ways to grow a following in the STEM category this year? I've been struggling with the algorithm.</p>
                <div className="flex items-center gap-4 text-xs text-white/40 pt-2">
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> 42 replies</span>
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Trending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DesktopLayout>

      {isDesktop === false && (
      <MobileShell>
        <div className="px-5 pt-4 pb-20">
           <h2 className="text-2xl font-black text-chrome mb-6">Community</h2>
           <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.name} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${group.color} flex items-center justify-center`}>
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{group.name}</p>
                      <p className="text-[10px] text-white/40">{group.members} members</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold text-cyan-400">Join</button>
                </div>
              ))}
           </div>
        </div>
      </MobileShell>
      )}
    </>
  );
}
