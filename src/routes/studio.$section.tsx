import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award, BarChart3, Crown, Gamepad2, Gift, Megaphone, Sparkles, TrendingUp, WalletCards } from "lucide-react";

export const Route = createFileRoute("/studio/$section")({
  head: () => ({ meta: [{ title: "Creator tools · Javan" }] }),
  component: StudioSection,
});

const content: Record<string, { title: string; kicker: string; icon: typeof Crown; accent: "primary" | "gold" | "rose"; rows: string[] }> = {
  analytics: { title: "Post analytics", kicker: "Views, followers, likes", icon: BarChart3, accent: "primary", rows: ["Profile and post views", "Net followers", "Likes and engagement", "Traffic sources"] },
  service: { title: "Service+ visibility", kicker: "Boost your reach", icon: Crown, accent: "primary", rows: ["Audience targeting", "Visibility goals", "Budget controls", "Campaign preview"] },
  "live-rewards": { title: "LIVE rewards", kicker: "Track gifts received", icon: Gift, accent: "gold", rows: ["Gift totals", "Top supporters", "Reward milestones", "LIVE payout readiness"] },
  subscriptions: { title: "Subscriptions", kicker: "Recurring fan revenue", icon: Sparkles, accent: "primary", rows: ["Subscriber tiers", "Monthly recurring revenue", "Member benefits", "Retention insights"] },
  "video-gifts": { title: "Video Gifts", kicker: "Post gift breakdown", icon: Gift, accent: "primary", rows: ["Gifted videos", "Creator share", "Top gift types", "Audience appreciation"] },
  gaming: { title: "Gaming Incentive", kicker: "Gaming creator rewards", icon: Gamepad2, accent: "primary", rows: ["Gaming stream goals", "Quest rewards", "Event performance", "Partner eligibility"] },
  monetization: { title: "More ways to get paid", kicker: "Monetization options", icon: WalletCards, accent: "gold", rows: ["Service+", "LIVE rewards", "Subscriptions", "Video Gifts", "Gaming Incentive"] },
  promote: { title: "Promote", kicker: "Marketing dashboard", icon: Megaphone, accent: "rose", rows: ["Active promotions", "Audience segments", "Spend pacing", "Result lift"] },
  benefits: { title: "Benefits", kicker: "Program milestones", icon: Award, accent: "primary", rows: ["Creator levels", "Milestone benefits", "Eligibility checklist", "Next unlock"] },
  payouts: { title: "Creator Rewards 2×", kicker: "Dynamic payout dashboard", icon: TrendingUp, accent: "gold", rows: ["Reward rate: 100 coins = $0.10", "Eligible creator earnings", "Payout milestones", "Program status"] },
};

function StudioSection() {
  const { section } = Route.useParams();
  const cfg = content[section] ?? content.analytics;
  const Icon = cfg.icon;
  const gradient = cfg.accent === "gold" ? "bg-gradient-gold text-black" : cfg.accent === "rose" ? "bg-gradient-live text-primary-foreground" : "bg-gradient-primary text-primary-foreground";

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/studio" className="p-1" aria-label="Back to Creator Studio"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">{cfg.title}</h1>
      </header>

      <div className="space-y-5 px-4 pt-5">
        <section className={`rounded-3xl p-5 shadow-elegant ${gradient}`}>
          <Icon className="h-8 w-8" />
          <div className="mt-10 text-xs font-bold uppercase tracking-[0.2em] opacity-70">{cfg.kicker}</div>
          <h2 className="mt-1 font-display text-3xl font-bold leading-tight">{cfg.title}</h2>
        </section>

        <section className="glass divide-y divide-border/40 overflow-hidden rounded-3xl">
          {cfg.rows.map((row) => (
            <button key={row} className="flex w-full items-center justify-between px-4 py-4 text-left active:bg-primary/5">
              <span className="text-sm font-semibold">{row}</span>
              <span className="text-xs font-bold text-primary">Open</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}