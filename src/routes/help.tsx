import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShieldCheck, KeyRound, ChevronRight, MessageCircle, Search } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Center · Boogle" }] }),
  component: HelpCenter,
});

const categories = ["Account", "Privacy and user safety", "Posts", "LIVE", "Using Boogle", "Monetization", "Other"];

const faq: Record<string, string[]> = {
  Account: ["Account growth", "Is my account suspended?", "Account safety", "Profile view history", "Forgot my password"],
  "Privacy and user safety": ["Report a problem", "Your account status", "Report another issue", "Account safety", "Content violations and bans"],
  Posts: ["Boogle post view history", "Audience controls", "Can't post videos", "Location information on Boogle", "App not responding"],
  LIVE: ["How to go live", "How to start a Mobile Gaming LIVE?", "Boogle LIVE multi-guest", "How to set up LIVE Poll?", "What is Boogle LIVE?"],
  "Using Boogle": ["Manage direct messages", "Direct messages", "Following and unfollowing", "Messaging with businesses", "Why am I seeing a '...too fast' error message?"],
  Monetization: ["How much does Promote cost?", "Can I promote a video more than one time?", "How Boogle Shop recommends content", "How to use Promote to LIVE?", "What is Promote to LIVE?"],
  Other: [
    "Benefits of removing inauthentic followers and likes",
    "Why I received a notification about 'inauthentic accounts'",
    "Searching for content",
    "Will there be other 'inauthentic accounts' in my follower/like list after previous ones are removed?",
    "The difference between 'inauthentic accounts' and 'inactive users'",
  ],
};

function HelpCenter() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [active, setActive] = useState(categories[0]);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  if (pathname !== "/help") return <Outlet />;

  const items = faq[active].filter((r) => r.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-32">
      <header className="glass-strong sticky top-0 z-20 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/settings" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold">Help Center</h1>
        </div>
      </header>

      <div className="px-4 pt-5">
        <h2 className="font-display text-3xl font-bold">How can we help?</h2>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" className="flex-1 bg-transparent text-sm outline-none" />
        </div>

        {/* Top shortcut cards */}
        <div className="mt-4 flex gap-3 overflow-x-auto no-scrollbar">
          <Link to="/settings/security/recovery" className="glass flex min-w-[180px] flex-col gap-2 rounded-2xl p-4 text-left">
            <div className="bg-gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-glow">
              <KeyRound className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Account recovery</div>
              <div className="text-[11px] text-muted-foreground">Get back into your account</div>
            </div>
          </Link>
          <Link to="/help/safety" className="glass flex min-w-[180px] flex-col gap-2 rounded-2xl p-4 text-left">
            <div className="bg-gradient-gold flex h-10 w-10 items-center justify-center rounded-xl shadow-elegant">
              <ShieldCheck className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="font-display text-sm font-bold">Safety Center</div>
              <div className="text-[11px] text-muted-foreground">Tools, tips, and resources</div>
            </div>
          </Link>
        </div>

        {/* Category tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <button
              key={c} onClick={() => { setActive(c); setOpen(null); }}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active === c ? "bg-gradient-primary text-primary-foreground shadow-glow" : "glass text-foreground"}`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* FAQ accordions */}
        <div className="glass mt-4 divide-y divide-border/40 overflow-hidden rounded-3xl">
          {items.map((row) => (
            <div key={row}>
              <button onClick={() => setOpen(open === row ? null : row)} className="flex w-full items-center gap-3 px-4 py-4 text-left">
                <span className="flex-1 text-sm font-medium">{row}</span>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition ${open === row ? "rotate-90" : ""}`} />
              </button>
              {open === row && (
                <div className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">
                  Detailed article coming soon. If you need urgent help on "{row}", tap "Chat with us" below and pick the matching issue type.
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted-foreground">No articles match "{q}".</div>}
        </div>
      </div>

      {/* Sticky chat CTA */}
      <div className="fixed inset-x-0 bottom-4 z-10 mx-auto max-w-[440px] px-4">
        <Link
          to="/help/chat"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 py-3.5 text-sm font-bold text-white shadow-[0_0_40px_-8px_rgba(244,63,94,0.7)]"
        >
          <MessageCircle className="h-4 w-4" /> Chat with us
        </Link>
      </div>
    </div>
  );
}
