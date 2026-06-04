import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import {
  X, Wallet, Activity, DownloadCloud, QrCode,
  Plus, Music2, Mic2, Settings, ChevronRight, Sparkles, LayoutDashboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = { to: string; label: string; icon: LucideIcon; hint?: string };
type Section = { title: string; items: Item[] };

const sections: Section[] = [
  {
    title: "Assets",
    items: [{ to: "/wallet", label: "Balance", icon: Wallet, hint: "Coins, earnings & payouts" }],
  },
  {
    title: "Personal tools",
    items: [
      { to: "/notifications", label: "Activity Center", icon: Activity },
      { to: "/offline", label: "Offline videos", icon: DownloadCloud },
      { to: "/qr", label: "Your QR code", icon: QrCode },
    ],
  },
  {
    title: "Creator tools",
    items: [
      { to: "/studio", label: "Creator Tools", icon: LayoutDashboard, hint: "Posts, LIVE, analytics" },
      { to: "/create", label: "Upload a video", icon: Plus, hint: "Post to your feed" },
      { to: "/artist/studio", label: "Music Studio", icon: Music2, hint: "Manage your tracks" },
      { to: "/artist/onboarding", label: "Artist Account", icon: Mic2, hint: "Claim your official music profile" },
    ],
  },
  {
    title: "Business",
    items: [
      { to: "/studio", label: "Creator Rewards 2×", icon: Sparkles, hint: "100 coins = $0.10 payout" },
    ],
  },
  {
    title: "Settings",
    items: [{ to: "/settings", label: "Settings and Privacy", icon: Settings }],
  },
];


export function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const renderItem = (item: Item, i: number) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.label}
        to={item.to}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-primary/5 ${i > 0 ? "border-t border-border/40" : ""}`}
      >
        <div className="bg-primary/10 ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{item.label}</div>
          {item.hint && <div className="truncate text-[11px] text-muted-foreground">{item.hint}</div>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed left-0 top-0 z-[81] h-[100dvh] w-[86vw] max-w-[360px] overflow-y-auto bg-background"
          >
            <div className="relative">
              <div className="bg-gradient-primary h-32 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="glass absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-5">
                <div className="font-display text-2xl font-bold tracking-tight">Menu</div>
                <div className="text-xs text-muted-foreground">Your Boogle workspace</div>
              </div>
            </div>

            <div className="space-y-6 px-4 pb-10 pt-4">
              {sections.map((sec) => (
                <div key={sec.title}>
                  <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {sec.title}
                  </div>
                  <div className="glass overflow-hidden rounded-3xl">
                    {sec.items.map((item, i) => renderItem(item, i))}
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
