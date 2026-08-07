import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Award, BarChart3, ChevronRight, Crown, Gift,
  Megaphone, Music2, Plus, Settings, Sparkles, TrendingUp,
  X, Home, Link as LinkIcon, Wallet, Star, Zap, Shield,
  Users, DollarSign, Eye, Heart, Play, Radio, Video
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const PAGE_TITLE = "Creator Studio · Javan";
const PAGE_DESC = "Javan Creator Studio: manage monetization, analytics, and growth tools.";

export const Route = createFileRoute("/studio/$section")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/studio" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/studio" }],
  }),
  component: StudioSection,
});

function StudioSection() {
  const { section } = Route.useParams();
  const navigate = useNavigate();

  if (section === "service" || section === "monetization") return <MonetizationHub />;
  if (section === "subscriptions") return <SubscriptionHub />;
  return <GenericSection section={section} />;
}

/* ──────────────────────────────────────────────
   MONETIZATION HUB
   ────────────────────────────────────────────── */
const RESOURCES = [
  { title: "Monetizing your content", body: "Javan has multiple programs designed to reward what you create.", views: "Official Guide", hue: "from-yellow-400 to-orange-500" },
  { title: "Creator Monetization Center", body: "Your all-in-one hub for getting rewarded on Javan.", views: "Creator Hub", hue: "from-rose-500 to-red-700" },
  { title: "Effect Creator Rewards", body: "Get paid for your effects when creators use them.", views: "Rewards Program", hue: "from-indigo-500 to-violet-700" },
];

function MonetizationHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"Recommended" | "LIVE rewards">("Recommended");

  return (
    <div className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-fuchsia-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={() => navigate({ to: "/studio" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back to studio">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Monetization</p>
          <h1 className="font-display text-lg font-black text-chrome">Creator Monetization Center</h1>
        </div>
        <Link to="/settings" className="p-2 rounded-full hover:bg-white/10 active:scale-90" aria-label="Settings">
          <Settings className="h-5 w-5 text-white/70" />
        </Link>
      </div>

      {/* Earnings Hero */}
      <div className="relative z-10 px-4 py-5">
        <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-rose-500/10 border border-white/10 p-5">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Estimated rewards (7 days)</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-sm text-white/50">$</span>
            <span className="text-4xl font-black text-white">0.00</span>
          </div>
          <Link
            to="/studio/$section"
            params={{ section: "payouts" }}
            className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
          >
            <span className="text-sm font-semibold">Balance: $0.03</span>
            <span className="flex items-center gap-1 text-sm text-white/80">
              View <ChevronRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* Rewards Analytics */}
      <div className="relative z-10 px-4 pt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-bold">Rewards analytics</h2>
          <Link to="/studio/$section" params={{ section: "analytics" }} className="flex items-center gap-1 text-sm text-white/50 hover:text-white">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {[
            { label: "LIVE rewards", value: "$0.00" },
            { label: "Work with Artists", value: "$0.00" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-xl font-bold"><span className="text-base text-white/50">$</span>{m.value.replace("$", "")}</div>
              <div className="mt-1 text-sm font-semibold">{m.label}</div>
              <div className="text-xs text-white/40">0.0% 7d</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="relative z-10 flex gap-1 px-4 border-t border-white/5 py-2">
        <button
          onClick={() => setTab("Recommended")}
          className={`flex-1 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
            tab === "Recommended" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          Recommended
        </button>
        <button
          onClick={() => setTab("LIVE rewards")}
          className={`flex-1 py-2 rounded-full text-xs font-bold transition-all active:scale-95 ${
            tab === "LIVE rewards" ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          LIVE rewards
        </button>
      </div>

      {/* Programs Grid */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 pb-8">
        <h2 className="font-display text-base font-bold mb-4">Active programs</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <ProgramCard
            icon={Music2}
            label="Work with Artists"
            href="/artist/onboarding"
            color="from-cyan-500 to-blue-500"
          />
          <ProgramCard
            icon={Gift}
            label="LIVE rewards"
            onClick={() => navigate({ to: "/studio/$section", params: { section: "live-rewards" } })}
            color="from-rose-500 to-orange-500"
          />
          <ProgramCard
            icon={Sparkles}
            label="Subscription"
            onClick={() => navigate({ to: "/studio/$section", params: { section: "subscriptions" } })}
            color="from-purple-500 to-violet-500"
          />
        </div>

        {/* Resources */}
        <h2 className="font-display text-base font-bold mb-4">Resources</h2>
        <div className="space-y-3">
          {RESOURCES.map((r) => (
            <div key={r.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start gap-3">
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${r.hue} flex items-center justify-center shrink-0`}>
                <FileIcon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold">{r.title}</h3>
                <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{r.body}</p>
                <span className="text-[10px] text-cyan-400 font-bold mt-1 block">{r.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ icon: Icon, label, href, onClick, color }: {
  icon: any; label: string; href?: string; onClick?: () => void; color: string;
}) {
  const Content = (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 active:scale-95 transition-all">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="text-[11px] font-bold text-center">{label}</span>
    </div>
  );

  if (href) return <Link to={href as any}>{Content}</Link>;
  return <button onClick={onClick}>{Content}</button>;
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

/* ──────────────────────────────────────────────
   SUBSCRIPTION HUB
   ────────────────────────────────────────────── */
function SubscriptionHub() {
  const navigate = useNavigate();
  const [policyOpen, setPolicyOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={() => navigate({ to: "/studio" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="font-display text-lg font-black text-chrome flex-1">Subscription Hub</h1>
        <button onClick={() => setPolicyOpen(true)} className="p-2 rounded-full hover:bg-white/10 active:scale-90" aria-label="Policy">
          <Shield className="h-5 w-5 text-white/70" />
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5">
        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-500/15 to-fuchsia-500/15 border border-purple-500/20 p-6 mb-6">
          <Star className="h-10 w-10 text-purple-400 mb-3" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-1">Earn recurring income</p>
          <h2 className="font-display text-3xl font-bold leading-tight">Subscription Accounts</h2>
          <p className="text-sm text-white/60 mt-3">Build a loyal fanbase with exclusive content and perks for subscribers.</p>
        </div>

        {/* Subscription Tiers */}
        <h2 className="font-display text-base font-bold mb-3">Subscription tiers</h2>
        <div className="space-y-3 mb-6">
          {[
            { name: "Bronze", price: "$4.99/mo", perks: ["Exclusive posts", "Early access to content", "Bronze badge"] },
            { name: "Silver", price: "$9.99/mo", perks: ["All Bronze perks", "Monthly Q&A sessions", "Silver badge", "Priority comments"] },
            { name: "Gold", price: "$19.99/mo", perks: ["All Silver perks", "1-on-1 monthly call", "Gold badge", "Custom content requests"] },
          ].map((tier) => (
            <div key={tier.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{tier.name}</span>
                <span className="text-sm font-black text-cyan-400">{tier.price}</span>
              </div>
              <ul className="space-y-1">
                {tier.perks.map((perk) => (
                  <li key={perk} className="text-xs text-white/60 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-white/30" /> {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => toast.info(`${tier.name} tier setup coming soon`)}
                className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs font-bold hover:bg-white/15 active:scale-95 transition-all"
              >
                Configure {tier.name}
              </button>
            </div>
          ))}
        </div>

        {/* Subscribers Count */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-xl font-black">0</p>
              <p className="text-xs text-white/50">Active subscribers</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-white/30" />
        </div>
      </div>

      {/* Policy Modal */}
      <AnimatePresence>
        {policyOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="w-full max-w-[480px] rounded-t-3xl bg-[#0a0a1a] border-t border-white/10 p-5"
            >
              <div className="flex justify-end mb-2">
                <button onClick={() => setPolicyOpen(false)} className="p-1" aria-label="Close">
                  <X className="h-5 w-5 text-white/50" />
                </button>
              </div>
              <h3 className="font-display text-xl font-bold leading-tight">Subscription Policy</h3>
              <p className="mt-3 text-sm text-white/60">
                Starting 05/21/2026, accounts that violate the Subscription Account Policy will have their subscription benefits revoked.
              </p>
              <div className="bg-white/5 rounded-2xl p-4 mt-4">
                <div className="text-sm font-bold mb-2">Possible reasons for disqualification:</div>
                <ul className="space-y-1.5 text-sm text-white/60">
                  <li>• Content violations</li>
                  <li>• Community Guidelines violations</li>
                  <li>• Security violations</li>
                </ul>
              </div>
              <button
                onClick={() => setPolicyOpen(false)}
                className="mt-5 w-full rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3.5 text-sm font-bold text-white shadow-glow active:scale-95 transition-all"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────
   GENERIC SECTIONS (analytics, live-rewards, etc.)
   ────────────────────────────────────────────── */
const genericSections: Record<string, { title: string; kicker: string; icon: any; accent: string; rows: string[] }> = {
  analytics: {
    title: "Post analytics",
    kicker: "Views, followers, likes",
    icon: BarChart3,
    accent: "cyan",
    rows: ["Profile and post views", "Net followers", "Likes and engagement", "Traffic sources"],
  },
  "live-rewards": {
    title: "LIVE rewards",
    kicker: "Track gifts received",
    icon: Gift,
    accent: "rose",
    rows: ["Gift totals", "Top supporters", "Reward milestones", "LIVE payout readiness"],
  },
  "video-gifts": {
    title: "Video Gifts",
    kicker: "Post gift breakdown",
    icon: Gift,
    accent: "amber",
    rows: ["Gifted videos", "Creator share", "Top gift types", "Audience appreciation"],
  },
  gaming: {
    title: "Gaming Incentive",
    kicker: "Gaming creator rewards",
    icon: Zap,
    accent: "purple",
    rows: ["Gaming stream goals", "Quest rewards", "Event performance", "Partner eligibility"],
  },
  promote: {
    title: "Promote",
    kicker: "Marketing dashboard",
    icon: Megaphone,
    accent: "rose",
    rows: ["Active promotions", "Audience segments", "Spend pacing", "Result lift"],
  },
  benefits: {
    title: "Benefits",
    kicker: "Program milestones",
    icon: Award,
    accent: "emerald",
    rows: ["Creator levels", "Milestone benefits", "Eligibility checklist", "Next unlock"],
  },
  payouts: {
    title: "Creator Rewards 2x",
    kicker: "Dynamic payout dashboard",
    icon: TrendingUp,
    accent: "gold",
    rows: ["Reward rate: 100 coins = $0.10", "Eligible creator earnings", "Payout milestones", "Program status"],
  },
};

const ACCENT_COLORS: Record<string, string> = {
  cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
  rose: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
  purple: "from-purple-500/20 to-violet-500/20 border-purple-500/30",
  emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  gold: "from-amber-400/20 to-yellow-500/20 border-amber-400/30",
};

function GenericSection({ section }: { section: string }) {
  const navigate = useNavigate();
  const cfg = genericSections[section] ?? genericSections.analytics;
  const Icon = cfg.icon;
  const gradient = ACCENT_COLORS[cfg.accent] ?? ACCENT_COLORS.cyan;

  return (
    <div className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-white/3 blur-[120px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={() => navigate({ to: "/studio" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="font-display text-lg font-black text-chrome flex-1">{cfg.title}</h1>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 pb-8">
        {/* Hero Card */}
        <div className={`rounded-3xl bg-gradient-to-br ${gradient} border p-6 mb-6`}>
          <Icon className="h-8 w-8 mb-3" />
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-1">{cfg.kicker}</div>
          <h2 className="font-display text-3xl font-bold leading-tight">{cfg.title}</h2>
        </div>

        {/* Detail Rows */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden divide-y divide-white/5">
          {cfg.rows.map((row) => (
            <button
              key={row}
              onClick={() => toast.success(`${row} opened`)}
              className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              <span className="text-sm font-semibold">{row}</span>
              <span className="text-xs font-bold text-cyan-400">Open</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
