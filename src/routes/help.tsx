import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DesktopLayout } from "@/components/DesktopLayout";
import { MobileShell } from "@/components/MobileShell";
import {
  MessageCircle, AlertTriangle, Shield, Search, ChevronDown,
  ArrowLeft, Headset, FileText, Zap, Lock, Users, Music2,
  DollarSign, HelpCircle, Phone, Mail, Clock, ExternalLink
} from "lucide-react";

const PAGE_TITLE = "Help Center · Javan";
const PAGE_DESC = "Get help with your Javan account, payments, content policies, and platform features.";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:url", content: "https://javan.lovable.app/help" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/help" }],
  }),
  component: HelpPage,
});

const FAQS = [
  {
    category: "Account",
    items: [
      { q: "How do I verify my identity?", a: "Go to Settings → Account → Verification. Upload a valid government ID and a selfie. Verification typically takes 24-48 hours." },
      { q: "How do I change my username?", a: "Visit your profile and tap Edit Profile. Your handle must be unique and can only be changed once every 30 days." },
      { q: "How do I delete my account?", a: "Contact our support team at support@javan.app with your account email. Deletion is permanent and processes within 30 days." },
    ],
  },
  {
    category: "Payments",
    items: [
      { q: "How do I withdraw my earnings?", a: "Go to Wallet → Payouts. Minimum withdrawal is $50. Payouts process within 3-5 business days via bank transfer or PayPal." },
      { q: "What payment methods are supported?", a: "We support direct bank transfer, PayPal, and mobile money (M-Pesa). Cryptocurrency payouts are coming soon." },
      { q: "How are LIVE gift earnings calculated?", a: "You receive 70% of the coin value of gifts sent during your LIVE broadcasts. The remaining 30% covers platform operations." },
    ],
  },
  {
    category: "Content",
    items: [
      { q: "What content is allowed on Javan?", a: "Original, creative content that follows our Community Guidelines. No hate speech, explicit content, or copyright violations." },
      { q: "How do I report inappropriate content?", a: "Tap the flag icon on any post or user profile. Reports are reviewed within 24 hours." },
      { q: "Can I use copyrighted music?", a: "You can use music from our built-in library. Uploading copyrighted audio may result in content removal or account restriction." },
    ],
  },
  {
    category: "LIVE Streaming",
    items: [
      { q: "How do I start a LIVE stream?", a: "Tap the + button in the bottom nav, select LIVE mode, add a title, and tap Go LIVE. You need at least 100 followers to go live." },
      { q: "What equipment do I need?", a: "A smartphone with a good camera and stable internet connection (4G/WiFi). Ring lights and external mics enhance quality." },
      { q: "How do I earn from LIVE streams?", a: "Viewers send virtual gifts during your broadcast. Each gift has a coin value, and you earn 70% of the total." },
    ],
  },
];

const SUPPORT_ACTIONS = [
  { icon: MessageCircle, label: "Live Chat", desc: "Chat with our AI assistant", href: "/help/chat", color: "from-fuchsia-500 to-rose-500", glow: "rgba(255,0,128,0.3)" },
  { icon: AlertTriangle, label: "Report Problem", desc: "Flag issues with the platform", href: "/report-problem", color: "from-amber-500 to-orange-500", glow: "rgba(245,158,11,0.3)" },
  { icon: Shield, label: "Safety Center", desc: "Community guidelines & safety", href: "/help/safety", color: "from-cyan-500 to-blue-500", glow: "rgba(6,182,212,0.3)" },
  { icon: Lock, label: "Privacy Policy", desc: "How we handle your data", href: "/settings/privacy", color: "from-violet-500 to-purple-500", glow: "rgba(139,92,246,0.3)" },
];

function HelpPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  // Flatten FAQs for search
  const flatFaqs = FAQS.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, category: cat.category }))
  );

  const filteredFaqs = flatFaqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase()) ||
      faq.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* ─── DESKTOP ─── */}
      <DesktopLayout>
        <div className="max-w-4xl mx-auto py-10 px-6">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-black text-chrome mb-3">Help Center</h1>
            <p className="text-white/50 max-w-lg mx-auto">Find answers, get support, and learn about Javan's features and policies.</p>
          </div>

          {/* Search */}
          <div className="relative mb-10 max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-base outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder-white/30"
            />
          </div>

          {/* Support Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {SUPPORT_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.href as any}
                className="group"
              >
                <div className={`flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-br ${action.color} p-5 text-center active:scale-95 transition-all shadow-lg hover:shadow-xl`}>
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{action.label}</h3>
                    <p className="text-[11px] text-white/70 mt-0.5">{action.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyan-400" /> Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {filteredFaqs.map((faq, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <button
                      onClick={() => setOpenIndex(openIndex === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="text-sm font-semibold text-white pr-3">{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                    </button>
                    {openIndex === i && (
                      <div className="px-5 pb-4 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-3">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" /> Contact Information
              </h2>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-bold text-sm mb-2">Email Support</h3>
                  <p className="text-sm text-white/60 mb-3">For non-urgent inquiries and general questions.</p>
                  <a href="mailto:support@javan.app" className="text-cyan-400 text-sm font-bold hover:underline flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> support@javan.app
                  </a>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-bold text-sm mb-2">Response Times</h3>
                  <div className="space-y-2 text-sm text-white/60">
                    <div className="flex justify-between"><span>Live Chat</span><span className="text-emerald-400 font-bold">~2 min</span></div>
                    <div className="flex justify-between"><span>Email Support</span><span className="text-amber-400 font-bold">24-48 hrs</span></div>
                    <div className="flex justify-between"><span>Ticket Escalation</span><span className="text-cyan-400 font-bold">2-4 hrs</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DesktopLayout>

      {/* ─── MOBILE ─── */}
      <div className="lg:hidden fixed inset-0 z-[60] bg-[#020210] flex flex-col">
        {/* Immersive Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/3 w-[400px] h-[400px] rounded-full bg-fuchsia-500/5 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
          <button onClick={() => navigate({ to: "/profile" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back to profile">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="font-display text-lg font-black text-chrome flex-1">Help Center</h1>
        </div>

        {/* Search */}
        <div className="relative z-10 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search help articles..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500 text-white placeholder-white/40"
            />
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="relative z-10 px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {SUPPORT_ACTIONS.map((action) => (
              <Link
                key={action.label}
                to={action.href as any}
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3 active:scale-95 transition-all"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shrink-0`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{action.label}</p>
                  <p className="text-[10px] text-white/50 truncate">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-white/50 mb-3">Frequently Asked Questions</h2>
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
                    <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                  </button>
                  {openIndex === i && (
                    <div className="px-4 pb-4 text-sm text-white/60 leading-relaxed">{faq.a}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-6 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wide text-white/50 mb-3">Contact Us</h2>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-white/80">support@javan.app</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[10px] text-white/50">Live Chat</p>
                  <p className="text-xs font-bold text-emerald-400">~2 min</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[10px] text-white/50">Email</p>
                  <p className="text-xs font-bold text-amber-400">24-48h</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[10px] text-white/50">Ticket</p>
                  <p className="text-xs font-bold text-cyan-400">2-4h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
