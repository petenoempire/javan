import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { ArrowLeft, ChevronDown, MessageCircle, AlertTriangle, Search } from "lucide-react";

const FAQS = [
  {
    q: "How do I earn coins on Javan?",
    a: "You earn coins through gifts sent to you during live streams and ad revenue from your posts. Once you reach the minimum threshold, you can request a payout from your Wallet.",
  },
  {
    q: "How long do payouts take?",
    a: "Payout requests are typically reviewed within 1-3 business days. A 2.5% platform processing fee applies to all withdrawals.",
  },
  {
    q: "How do I become a verified artist?",
    a: "Go to Profile → Become an Artist and submit proof of your original music (a distributor confirmation, Spotify for Artists screenshot, etc). Our team reviews applications within a few days.",
  },
  {
    q: "How do I get the verified badge?",
    a: "Public figures, artists, celebrities, politicians, and businesses can apply at Profile → Get Verified. You'll need to submit proof of identity and notability.",
  },
  {
    q: "Why was my post removed?",
    a: "Posts may be removed for violating our community guidelines, including spam, harassment, nudity, or copyright infringement. Check your email for details if this happens.",
  },
  {
    q: "How do I report a user or post?",
    a: "Tap the flag icon on any profile, or the ... menu on a post, and select Report. Choose a reason and submit — our team reviews all reports.",
  },
  {
    q: "How do 2FA codes work?",
    a: "When you sign up, we send a verification code to both your phone and email. When logging in, we send a login code to your email to keep your account secure.",
  },
  {
    q: "Can I change my region after signup?",
    a: "Your region is set at signup based on your country and affects your app theme and available features. Contact support if you need this changed.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center · Javan" },
      { name: "description", content: "Get answers to common questions about coins, payouts, verification, reporting, and account security on Javan." },
      { property: "og:title", content: "Help Center · Javan" },
      { property: "og:description", content: "Get answers to common questions about coins, payouts, verification, reporting, and account security on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/help" },
      { name: "twitter:title", content: "Help Center · Javan" },
      { name: "twitter:description", content: "Get answers to common questions about coins, payouts, verification, reporting, and account security on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/help" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(FAQ_SCHEMA),
      },
    ],
  }),
  component: HelpCenterPage,
});

function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = FAQS.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" aria-label="Back to profile" className="text-white/50 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg font-black">Help Center</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help articles..."
            className="w-full rounded-full border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
          />
        </div>

        {/* Chat with us + Report a problem */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <Link
            to="/help/chat"
            className="flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br from-fuchsia-600/20 to-rose-600/20 border border-fuchsia-500/20 p-4 text-center active:scale-95 transition-all"
          >
            <MessageCircle className="h-6 w-6 text-fuchsia-400" />
            <span className="text-xs font-bold text-white">Chat with us</span>
          </Link>
          <Link
            to="/report-problem"
            className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 border border-white/10 p-4 text-center active:scale-95 transition-all"
          >
            <AlertTriangle className="h-6 w-6 text-amber-400" />
            <span className="text-xs font-bold text-white">Report a Problem</span>
          </Link>
        </div>

        {/* FAQ list */}
        <h2 className="text-xs font-bold uppercase tracking-wide text-white/50 mb-3">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {filteredFaqs.length === 0 ? (
            <p className="text-center text-sm text-white/40 py-8">No results found</p>
          ) : (
            filteredFaqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-semibold text-white pr-3">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${
                      openIndex === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
