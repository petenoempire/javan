import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, AtSign, KeyRound, ChevronRight, Mic2 } from "lucide-react";

export const Route = createFileRoute("/settings/account")({
  head: () => ({ meta: [{ title: "Account · Admiralty" }] }),
  component: AccountSettings,
});

const items = [
  { to: "/settings/account/verification", label: "Verification", icon: ShieldCheck, hint: "Reserved for public figures, brands & celebrities" },
  { to: "/artist/onboarding", label: "Artist Account", icon: Mic2, hint: "Claim your official music profile" },
  { to: "/profile/edit", label: "Username & identity", icon: AtSign },
  { to: "/settings/account/security", label: "Password & security", icon: KeyRound },
];

function AccountSettings() {
  return (
    <div className="mx-auto min-h-[100dvh] max-w-[480px] bg-background pb-24">
      <header className="glass-strong sticky top-0 z-10 flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to="/settings" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-lg font-bold">Account</h1>
      </header>

      <div className="px-4 pt-5">
        <div className="glass overflow-hidden rounded-3xl">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3.5 active:bg-primary/5 ${
                  i > 0 ? "border-t border-border/40" : ""
                }`}
              >
                <div className="ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.label}</div>
                  {item.hint && <div className="truncate text-[11px] text-muted-foreground">{item.hint}</div>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
