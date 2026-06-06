import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, UserPlus, Gift, Wallet, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/notifications")({
  head: () => ({ meta: [{ title: "Notifications · Javan" }] }),
  component: NotifSettings,
});

const items = [
  { key: "likes", label: "Likes", desc: "When someone likes your post", icon: Heart },
  { key: "comments", label: "Comments", desc: "Replies and mentions", icon: MessageCircle },
  { key: "follows", label: "New followers", desc: "When someone follows you", icon: UserPlus },
  { key: "gifts", label: "Gifts", desc: "Coin gifts from your audience", icon: Gift },
  { key: "wallet", label: "Wallet activity", desc: "Top-ups, payouts, earnings", icon: Wallet },
  { key: "system", label: "System updates", desc: "Account, security, policy", icon: Bell },
];

function NotifSettings() {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.key, true])),
  );

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-20">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Notifications</h1>
      </header>

      <div className="space-y-4 px-4 pt-5">
        <div className="glass overflow-hidden rounded-3xl">
          {items.map((it, i) => {
            const I = it.icon;
            const on = state[it.key];
            return (
              <div key={it.key}
                className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? "border-t border-border/40" : ""}`}>
                <div className="ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <I className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{it.label}</div>
                  <div className="text-[11px] text-muted-foreground">{it.desc}</div>
                </div>
                <button onClick={() => setState(s => ({ ...s, [it.key]: !on }))}
                  className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${on ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>

        <button onClick={() => toast.success("Notification preferences saved")}
          className="bg-gradient-primary w-full rounded-2xl py-3 text-sm font-bold text-primary-foreground shadow-glow">
          Save changes
        </button>
      </div>
    </div>
  );
}
