import { createFileRoute, Link } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Award, DollarSign, TrendingUp, Users, Gift, Star, Zap, ChevronRight, Play } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Creator Rewards: Get Paid for Your Content · Javan" },
      { name: "description", content: "Learn how to earn rewards on Javan. From LIVE gifts to the Creator Rewards Program, discover all the ways you can monetize your creativity and grow your brand." },
      { property: "og:title", content: "Creator Rewards: Get Paid for Your Content · Javan" },
      { property: "og:description", content: "Turn your passion into profit. Explore Javan's monetization programs, including LIVE gifts, subscriptions, and creator incentives." },
      { property: "og:url", content: "https://javan.lovable.app/rewards" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Creator Rewards: Get Paid for Your Content · Javan" },
      { name: "twitter:description", content: "Monetize your creativity on Javan. Join our rewards programs today." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/rewards" }],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const isDesktop = useIsDesktop();

  const programs = [
    {
      title: "LIVE Rewards",
      description: "Receive virtual gifts from your fans in real-time while you stream. Convert gifts into real rewards.",
      icon: Gift,
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "Creator Rewards Program",
      description: "Get rewarded for creating high-quality, original content that resonates with the Javan community.",
      icon: Award,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Subscriptions",
      description: "Build a recurring income stream by offering exclusive content and perks to your most dedicated fans.",
      icon: Star,
      color: "from-purple-500 to-indigo-600",
    },
    {
      title: "Work with Artists",
      description: "Get paid to use trending music in your videos and help artists reach new audiences.",
      icon: Zap,
      color: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <>
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-20">
          <div className="text-center mb-20">
            <h1 className="text-6xl font-black text-chrome tracking-tight mb-6">Turn Your Creativity<br />Into Rewards</h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Javan offers multiple ways for creators to get rewarded for their passion. 
              Whether you're a live streamer, a short-form video creator, or an artist, there's a program for you.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link to="/create" className="bg-gradient-primary px-8 py-4 rounded-2xl font-black text-white shadow-glow hover:scale-105 transition-transform">
                Start Creating
              </Link>
              <Link to="/studio" className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-white hover:bg-white/10 transition-colors">
                View My Studio
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {programs.map((p) => (
              <div key={p.title} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group">
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <p.icon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-4">{p.title}</h2>
                <p className="text-white/60 leading-relaxed mb-6">
                  {p.description}
                </p>
                <Link to="/studio" className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300" aria-label={`Learn how to earn ${p.title}`}
                  
                  Explore {p.title} rewards <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="glass p-12 rounded-[3rem] border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-4xl font-black mb-6">Why creators choose Javan</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">High Engagement</h3>
                    <p className="text-sm text-white/50">Our algorithm prioritizes quality and community resonance over pure follower count.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Direct Fan Support</h3>
                    <p className="text-sm text-white/50">Fans can support you directly through gifts, subscriptions, and digital goods.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Transparent Payouts</h3>
                    <p className="text-sm text-white/50">Track your rewards in real-time and enjoy fast, secure payouts to your preferred method.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/3 aspect-square rounded-[2rem] bg-gradient-to-tr from-rose-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent)]" />
               <Play className="h-20 w-20 text-white/20 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      </DesktopLayout>

      {isDesktop === false && (
      <MobileShell>
        <div className="px-5 pt-4 pb-24">
          <h2 className="text-3xl font-black text-chrome mb-4">Creator Rewards</h2>
          <p className="text-sm text-white/50 mb-8">
            Get rewarded for your creativity on Javan.
          </p>

          <div className="space-y-4 mb-10">
            {programs.map((p) => (
              <div key={p.title} className="glass p-6 rounded-3xl border border-white/5">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-4`}>
                  <p.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-bold mb-2">{p.title}</h2>
                <p className="text-xs text-white/60 mb-4">{p.description}</p>
                <Link to="/studio" className="text-xs font-bold text-cyan-400">Join Program</Link>
              </div>
            ))}
          </div>

          <div className="bg-gradient-primary p-8 rounded-3xl text-center shadow-glow">
            <h2 className="text-xl font-black text-white mb-2">Ready to earn?</h2>
            <p className="text-xs text-white/80 mb-6">Start your creator journey today.</p>
            <Link to="/create" className="inline-block bg-white text-black px-6 py-3 rounded-xl text-sm font-black">
              Create Now
            </Link>
          </div>
        </div>
      </MobileShell>
      )}
    </>
  );
}
