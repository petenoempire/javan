import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft, Award, BarChart3, ChevronRight, Crown, Flag, Gamepad2, Gift,
  Megaphone, Music2, Plus, Settings, Sparkles, Sticker, TrendingUp,
  X, FileText, Sliders, Home, BookmarkPlus, Wand2, Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/studio/$section")({
  head: () => ({ meta: [{ title: "Monetization · Javan" }] }),
  component: StudioSection,
});

function StudioSection() {
  const { section } = Route.useParams();
  if (section === "service" || section === "monetization") return <MonetizationHub />;
  if (section === "subscriptions") return <SubscriptionHub />;
  return <GenericSection section={section} />;
}

/* =========================================================
   MONETIZATION HUB (Service+ / Monetization)
   ========================================================= */

const RESOURCES = [
  { title: "Monetizing your content on Javan", body: "Javan has multiple programs designed to reward what you create — and the right fit depends on your style.", views: "10.3M views", hue: "from-yellow-400 to-orange-500" },
  { title: "Creator Monetization Center", body: "Meet the Creator Monetization Center—your all-in-one hub for getting rewarded on Javan.", views: "8.1M views", hue: "from-rose-500 to-red-700" },
  { title: "Effect Creator Rewards", body: "Wondered what Javan's Effect Creator Rewards is? It's an awesome way to get paid for your effects.", views: "5.3M views", hue: "from-indigo-500 to-violet-700" },
];

function MonetizationHub() {
  const [tab, setTab] = useState<"Recommended" | "LIVE rewards">("Recommended");
  const [resTab, setResTab] = useState(0);
  const resTabs = ["Recommended", "Creator Rewards Program", "Subscription", "LIVE rewards", "Creator Marketplace", "Javan Shop for Creators"];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-muted/40 pb-24 dark:bg-background">
      {/* Dark hero header */}
      <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(220_15%_18%),hsl(220_15%_8%))] px-4 pb-6 pt-3 text-white">
        <div className="flex items-center justify-between">
          <Link to="/studio" className="-ml-1 p-2" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex items-center gap-2">
            <button onClick={() => toast.success("Monetization report tools opened")} className="p-2" aria-label="Report"><Flag className="h-5 w-5" /></button>
            <Link to="/settings" className="p-2" aria-label="Settings"><Settings className="h-5 w-5" /></Link>
          </div>
        </div>
        <div className="mt-1 text-sm font-semibold text-white/60">Monetization</div>
        <button className="mt-2 flex items-end gap-1 active:scale-95">
          <span className="text-2xl font-bold">$</span>
          <span className="font-display text-5xl font-bold leading-none">0.00</span>
          <ChevronRight className="mb-2 h-5 w-5 text-white/70" />
        </button>
        <div className="mt-1 text-xs text-white/70">Estimated rewards in the last 7 days ⓘ</div>

        <Link to="/wallet" className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
          <span className="text-sm font-semibold">Balance: $0.03</span>
          <span className="flex items-center gap-1 text-sm text-white/80">View <ChevronRight className="h-4 w-4" /></span>
        </Link>
      </div>

      {/* Rewards analytics */}
      <section className="bg-background px-4 pt-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Rewards analytics</h2>
          <Link to="/studio/$section" params={{ section: "analytics" }} className="flex items-center gap-1 text-sm text-muted-foreground">View all <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 pb-5">
          {[
            { label: "LIVE rewards" },
            { label: "Work with Artists" },
          ].map((m) => (
            <div key={m.label} className="rounded-2xl bg-muted/60 p-4">
              <div className="font-display text-xl font-bold"><span className="text-base">$</span>0.00</div>
              <div className="mt-1 text-sm font-semibold">{m.label}</div>
              <div className="text-xs text-muted-foreground">0.0% 7d</div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Active programs */}
      <section className="bg-background px-4 py-5">
        <h2 className="font-display text-lg font-bold">Active programs</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <ActiveProgram icon={Music2} label="Work with Artists" to="/artist/onboarding" />
          <ActiveProgram icon={Gift} label="LIVE rewards" section="live-rewards" />
          <ActiveProgram icon={Sparkles} label="Subscription" section="subscriptions" />
        </div>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Programs for you */}
      <section className="bg-background px-4 py-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Programs for you ⓘ</h2>
          <Link to="/studio/$section" params={{ section: "benefits" }} className="flex items-center gap-1 text-sm text-muted-foreground">View all <ChevronRight className="h-4 w-4" /></Link>
        </div>

        <div className="mt-4 flex items-start gap-3">
          <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Megaphone className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">Service+</span>
              <span className="inline-flex items-center rounded-full border border-sky-400/40 px-2 py-0.5 text-[10px] font-semibold text-sky-500">👍 Recommended</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Build connections with potential clients when you're LIVE.</div>
          </div>
          <button onClick={() => toast.success("Service+ request submitted for eligibility review")} className="bg-gradient-live shrink-0 rounded-full px-5 py-2 text-sm font-bold text-primary-foreground shadow-glow">Join</button>
        </div>

        <div className="my-4 border-t border-border/40" />

        <Link to="/studio/$section" params={{ section: "video-gifts" }} className="flex items-start gap-3">
          <div className="bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"><Gift className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">Video Gifts</span>
              <span className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">🔒 4/5</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Get Gifts for your top-performing videos.</div>
          </div>
          <ChevronRight className="mt-2 h-4 w-4 text-muted-foreground" />
        </Link>

        <button onClick={() => toast.success("Eligibility notifications enabled")} className="mt-5 w-full rounded-full bg-muted/70 py-3 text-sm font-bold">Get notified when I'm eligible</button>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Trending */}
      <section className="bg-background px-4 py-5">
        <h2 className="font-display text-lg font-bold">Trending in Monetization</h2>
        <div className="mt-3 flex gap-2">
          {(["Recommended", "LIVE rewards"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${tab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-muted/60 p-5 text-sm text-muted-foreground">
          Rankings will appear here after real creators join programs and generate eligible activity.
        </div>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Learning resources */}
      <section className="bg-background px-4 py-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Learning resources</h2>
          <button onClick={() => toast.info("All learning resources are filtered below")} className="flex items-center gap-1 text-sm text-muted-foreground">View all <ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="no-scrollbar mt-3 -mx-4 flex gap-2 overflow-x-auto px-4">
          {resTabs.map((t, i) => (
            <button key={t} onClick={() => setResTab(i)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${resTab === i ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-5">
          {RESOURCES.map((r) => (
            <article key={r.title} className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold leading-snug">{r.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.body}</p>
                <div className="mt-1 text-xs text-muted-foreground">{r.views}</div>
              </div>
              <div className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${r.hue}`} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActiveProgram({ icon: Icon, label, section, to }: { icon: any; label: string; section?: string; to?: "/artist/onboarding" }) {
  const body = (
    <>
      <div className="bg-muted flex h-16 w-full items-center justify-center rounded-2xl">
        <Icon className="h-6 w-6" />
      </div>
      <div className="mt-2 text-center text-sm font-semibold leading-tight">{label}</div>
    </>
  );
  if (section) return <Link to="/studio/$section" params={{ section }} className="block active:scale-95">{body}</Link>;
  return <Link to={to!} className="block active:scale-95">{body}</Link>;
}

/* =========================================================
   SUBSCRIPTION HUB
   ========================================================= */

function SubscriptionHub() {
  const [policyOpen, setPolicyOpen] = useState(false);
  const [growthTab, setGrowthTab] = useState<"Get traffic" | "Build content">("Get traffic");
  const [playbookTab, setPlaybookTab] = useState<"Highlights" | "Trending creators" | "Best practices">("Highlights");
  const [bannerOpen, setBannerOpen] = useState(true);
  const [newOpen, setNewOpen] = useState(true);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-muted/30 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/95 px-2 py-3 backdrop-blur">
        <Link to="/studio" className="p-2" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-base font-bold">Subscription</h1>
        <button className="p-2" aria-label="Menu" onClick={() => setPolicyOpen(true)}>
          <div className="flex flex-col gap-1"><span className="h-0.5 w-4 bg-foreground" /><span className="h-0.5 w-4 bg-foreground" /><span className="h-0.5 w-4 bg-foreground" /></div>
        </button>
      </header>

      {/* Banner */}
      {bannerOpen && (
        <div className="flex items-start gap-3 bg-background px-4 py-4">
          <div className="bg-gradient-to-br from-amber-500 to-rose-600 h-16 w-16 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-base font-bold leading-tight">Get paid regularly with Subscription</div>
            <div className="mt-1 text-sm text-muted-foreground">Turn subscriber support into predictable monthly rewards.</div>
            <button onClick={() => setPolicyOpen(true)} className="mt-1 text-sm font-bold">Learn how</button>
          </div>
          <button onClick={() => setBannerOpen(false)} aria-label="Dismiss" className="p-1 text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="h-2 bg-muted/40" />

      {/* Grow your community */}
      <section className="bg-background px-4 py-5">
        <h2 className="font-display text-xl font-bold">Grow your community</h2>
        <div className="mt-3 flex gap-2">
          {(["Get traffic", "Build content"] as const).map((t) => (
            <button key={t} onClick={() => setGrowthTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${growthTab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4">
          {[
            { title: "Sub-only video preview", body: "Grow your community further by allowing everyone to preview.", cta: "Try" },
            { title: "Add a link to your next post", body: "Invite viewers to join your community! A subscription link will be added automatically.", cta: "Try" },
          ].map((c) => (
            <div key={c.title} className="border-border min-w-[78%] shrink-0 rounded-2xl border bg-background p-4">
              <div className="font-bold">{c.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
              <button onClick={() => toast.success(`${c.title} setup opened`)} className="mt-6 w-full text-right text-sm font-bold">{c.cta}</button>
            </div>
          ))}
        </div>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Plans */}
      <section className="bg-background px-4 py-5">
        <h2 className="font-display text-xl font-bold">Subscription plans</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="border-border rounded-2xl border bg-background p-5">
            <div className="text-center font-bold">Deluxe</div>
            <div className="mt-3 text-center font-display text-lg font-bold">NGN4950.00</div>
            <div className="text-center text-sm text-muted-foreground">per month</div>
          </div>
          <button onClick={() => toast.success("New subscription plan editor opened")} className="border-border flex flex-col items-center justify-center gap-2 rounded-2xl border bg-background p-5">
            <Plus className="h-6 w-6" />
            <span className="text-sm">Add plan</span>
          </button>
        </div>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Manage community benefits */}
      <section className="bg-background px-4 py-5">
        <h2 className="font-display text-xl font-bold">Manage community benefits</h2>

        {newOpen && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-sky-500/10 px-4 py-3 text-sm">
            <p><span className="font-bold">New:</span> You can now post Stories exclusive to subscribers. Give it a try!</p>
            <button onClick={() => setNewOpen(false)} aria-label="Dismiss" className="text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <div className="bg-muted relative flex h-10 w-10 items-center justify-center rounded-full">
            <BookmarkPlus className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </div>
          <div className="flex-1 font-bold">Sub-only posts</div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="ml-12 mt-3 flex">
          <button onClick={() => toast.success("Sub-only post composer opened")} className="border-border flex h-32 w-24 flex-col items-center justify-center rounded-xl border">
            <Plus className="h-6 w-6" />
            <span className="mt-1 text-xs">Add</span>
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {[
            { icon: Sparkles, label: "Sub-only Stories", dot: true },
            { icon: Award, label: "Badges" },
            { icon: Sticker, label: "Stickers" },
            { icon: Home, label: "Sub-only space" },
            { icon: FileText, label: "Subscriber notes" },
            { icon: Sliders, label: "Customizable perks" },
          ].map((r) => (
            <button key={r.label} onClick={() => toast.success(`${r.label} settings opened`)} className="flex w-full items-center gap-3 text-left">
              <div className="bg-muted relative flex h-10 w-10 items-center justify-center rounded-full">
                <r.icon className="h-5 w-5" />
                {r.dot && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-rose-500" />}
              </div>
              <div className="flex-1 font-bold">{r.label}</div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Playbook */}
      <section className="bg-background px-4 py-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Subscription Playbook</h2>
          <button onClick={() => toast.info("Showing the full playbook section")} className="flex items-center gap-1 text-sm text-muted-foreground">View all <ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {(["Highlights", "Trending creators", "Best practices"] as const).map((t) => (
            <button key={t} onClick={() => setPlaybookTab(t)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${playbookTab === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <article className="border-border mt-4 flex gap-3 rounded-2xl border p-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-amber-500 to-rose-500 h-10 w-10 rounded-full" />
              <div className="font-display font-bold">Katie Van Slyke</div>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="border-border rounded-full border px-2 py-0.5">42K subscribers</span>
              <span className="border-border rounded-full border px-2 py-0.5">Animals</span>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" />Behind-the-scenes barn moments and foaling updates.</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0" />Teaches training methods and riding strategies.</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-pink-700 h-28 w-20 shrink-0 rounded-xl" />
        </article>
      </section>

      <div className="h-2 bg-muted/40" />

      {/* Widen your reach */}
      <section className="bg-background px-4 py-5">
        <h2 className="font-display text-xl font-bold">Widen your reach</h2>
        <div className="mt-4 flex gap-6">
          <button onClick={() => toast.success("Subscription spotlight setup opened")} className="flex flex-col items-center gap-2">
            <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full"><Wand2 className="h-5 w-5" /></div>
            <span className="text-xs font-semibold">Subscription spotlight</span>
          </button>
          <button onClick={() => navigator.clipboard?.writeText(`${location.origin}/profile`).then(() => toast.success("Subscription link copied"))} className="flex flex-col items-center gap-2">
            <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full"><LinkIcon className="h-5 w-5" /></div>
            <span className="text-xs font-semibold">Subscription link</span>
          </button>
        </div>
      </section>

      {/* Payment setup sticky */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-border/40 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 text-sm text-muted-foreground">Set up your payment method to receive your monthly payouts.</div>
          <Link to="/studio/$section" params={{ section: "payouts" }} className="bg-gradient-live rounded-full px-4 py-1.5 text-sm font-bold text-primary-foreground">Set up</Link>
          <button onClick={() => toast.info("Payment reminder dismissed")} aria-label="Dismiss" className="text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Policy modal */}
      {policyOpen && <PolicyModal onClose={() => setPolicyOpen(false)} />}
    </div>
  );
}

function PolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="mx-auto w-full max-w-[480px] rounded-t-3xl bg-background p-5">
        <div className="flex justify-end"><button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button></div>
        <h3 className="font-display text-2xl font-bold leading-tight">Upcoming policy update for Subscription accounts</h3>
        <p className="mt-4 text-sm text-muted-foreground">Starting 05/21/2026, accounts that violate the Subscription Account Policy will have their subscription benefits revoked. We've updated the Terms to reflect this change.</p>
        <div className="bg-muted/60 mt-5 rounded-2xl p-4">
          <div className="font-bold">Possible reasons for disqualification:</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>• Content violations</li>
            <li>• Community Guidelines violations</li>
            <li>• Security violations</li>
          </ul>
          <button className="mt-3 text-sm font-bold text-sky-500">Learn more</button>
        </div>
        <button onClick={onClose} className="bg-gradient-live mt-5 w-full rounded-full py-3.5 text-sm font-bold text-primary-foreground shadow-glow">Got it</button>
      </div>
    </div>
  );
}

/* =========================================================
   GENERIC FALLBACK
   ========================================================= */

const generic: Record<string, { title: string; kicker: string; icon: typeof Crown; accent: "primary" | "gold" | "rose"; rows: string[] }> = {
  analytics: { title: "Post analytics", kicker: "Views, followers, likes", icon: BarChart3, accent: "primary", rows: ["Profile and post views", "Net followers", "Likes and engagement", "Traffic sources"] },
  "live-rewards": { title: "LIVE rewards", kicker: "Track gifts received", icon: Gift, accent: "gold", rows: ["Gift totals", "Top supporters", "Reward milestones", "LIVE payout readiness"] },
  "video-gifts": { title: "Video Gifts", kicker: "Post gift breakdown", icon: Gift, accent: "primary", rows: ["Gifted videos", "Creator share", "Top gift types", "Audience appreciation"] },
  gaming: { title: "Gaming Incentive", kicker: "Gaming creator rewards", icon: Gamepad2, accent: "primary", rows: ["Gaming stream goals", "Quest rewards", "Event performance", "Partner eligibility"] },
  promote: { title: "Promote", kicker: "Marketing dashboard", icon: Megaphone, accent: "rose", rows: ["Active promotions", "Audience segments", "Spend pacing", "Result lift"] },
  benefits: { title: "Benefits", kicker: "Program milestones", icon: Award, accent: "primary", rows: ["Creator levels", "Milestone benefits", "Eligibility checklist", "Next unlock"] },
  payouts: { title: "Creator Rewards 2×", kicker: "Dynamic payout dashboard", icon: TrendingUp, accent: "gold", rows: ["Reward rate: 100 coins = $0.10", "Eligible creator earnings", "Payout milestones", "Program status"] },
};

function GenericSection({ section }: { section: string }) {
  const cfg = generic[section] ?? generic.analytics;
  const Icon = cfg.icon;
  const gradient = cfg.accent === "gold" ? "bg-gradient-gold text-black" : cfg.accent === "rose" ? "bg-gradient-live text-primary-foreground" : "bg-gradient-primary text-primary-foreground";

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-20 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/studio" className="p-1" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
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
