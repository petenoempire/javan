import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import { Award, DollarSign, TrendingUp, Users, Gift, Star, Zap, ChevronRight, Play, ArrowLeft, Radio, Crown, Sparkles, Music2, Video } from "lucide-react";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { motion } from "motion/react";

const PAGE_TITLE = "Creator Rewards · Javan";
const PAGE_DESC = "Turn your creativity into rewards. Explore Javan's monetization programs.";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/rewards" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/rewards" }],
  }),
  component: RewardsPage,
});

const programs = [
  {
    title: "LIVE Rewards",
    description: "Receive virtual gifts from your fans in real-time while you stream. Convert gifts into real rewards.",
    icon: Gift,
    color: "from-rose-500 to-pink-600",
    rate: "70% share",
  },
  {
    title: "Creator Rewards Program",
    description: "Get rewarded for creating high-quality, original content that resonates with the Javan community.",
    icon: Award,
    color: "from-amber-500 to-orange-600",
    rate: "100 coins = $0.10",
  },
  {
    title: "Subscriptions",
    description: "Build a recurring income stream by offering exclusive content and perks to your most dedicated fans.",
    icon: Star,
    color: "from-purple-500 to-indigo-600",
    rate: "Up to $19.99/mo",
  },
  {
    title: "Work with Artists",
    description: "Get paid to use trending music in your videos and help artists reach new audiences.",
    icon: Music2,
    color: "from-cyan-500 to-blue-600",
    rate: "Per use payout",
  },
];

function RewardsPage() {
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();

  return (
    <>
      {/* ─── DESKTOP ─── */}
      <DesktopLayout>
        <div className="max-w-6xl mx-auto py-16 px-6">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-black text-chrome tracking-tight mb-4"
            >
              Turn Your Creativity<br />Into Rewards
            </motion.h1>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Javan offers multiple ways for creators to get rewarded for their passion.
              Whether you're a live streamer, a short-form video creator, or an artist, there's a program for you.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                to="/create"
                search={{ mode: undefined }}
                className="bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-8 py-4 rounded-2xl font-black text-white shadow-glow hover:scale-105 transition-transform active:scale-95"
              >
                Start Creating
              </Link>
              <Link
                to="/studio"
                className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black text-white hover:bg-white/10 transition-colors active:scale-95"
              >
                View My Studio
              </Link>
            </div>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {programs.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <p.icon className="h-7 w-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-black">{p.title}</h2>
                  <span className="text-[10px] font-bold bg-white/10 rounded-full px-2 py-0.5 text-white/70">{p.rate}</span>
                </div>
                <p className="text-white/60 leading-relaxed mb-5">{p.description}</p>
                <Link to="/studio" className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                  Explore program <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Why Creators Choose Javan */}
          <div className="glass p-10 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <h2 className="text-3xl font-black mb-8">Why creators choose Javan</h2>
            <div className="space-y-6">
              {[
                { icon: TrendingUp, color: "cyan", title: "High Engagement", desc: "Our algorithm prioritizes quality and community resonance over pure follower count." },
                { icon: Users, color: "purple", title: "Direct Fan Support", desc: "Fans can support you directly through gifts, subscriptions, and digital goods." },
                { icon: DollarSign, color: "rose", title: "Transparent Payouts", desc: "Track your rewards in real-time and enjoy fast, secure payouts to your preferred method." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className={`h-10 w-10 rounded-full bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center shrink-0`}>
                    <item.icon className={`h-5 w-5 text-${item.color}-400`} />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DesktopLayout>

      {/* ─── MOBILE ─── */}
      <div className="lg:hidden fixed inset-0 z-[60] bg-[#020210] flex flex-col">
        {/* Immersive Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] rounded-full bg-fuchsia-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <button onClick={() => navigate({ to: "/profile" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="font-display text-lg font-black text-chrome flex-1">Creator Rewards</h1>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 pb-8">
          <p className="text-sm text-white/50 mb-6">Get rewarded for your creativity on Javan.</p>

          {/* Programs */}
          <div className="space-y-4 mb-8">
            {programs.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shrink-0 shadow-lg`}>
                    <p.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold">{p.title}</h3>
                      <span className="text-[9px] font-bold bg-white/10 rounded-full px-1.5 py-0.5 text-white/60">{p.rate}</span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed mb-3">{p.description}</p>
                    <Link to="/studio" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                      Join Program →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/20 p-6 text-center">
            <h2 className="text-xl font-black mb-2">Ready to earn?</h2>
            <p className="text-xs text-white/60 mb-5">Start your creator journey today.</p>
            <Link
              to="/create"
              search={{ mode: undefined }}
              className="inline-block bg-white text-black px-6 py-3 rounded-xl text-sm font-black active:scale-95 transition-all"
            >
              Create Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
