import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, AtSign, KeyRound, ChevronRight, Mic2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/account")({
  head: () => ({ meta: [{ title: "Account · Javan" }] }),
  component: AccountSettings,
});

type Item = { to?: string; label: string; icon: typeof ShieldCheck; hint?: string; soon?: boolean };
const items: Item[] = [
  { to: "/settings/account/verification", label: "Verification", icon: ShieldCheck, hint: "Reserved for public figures, brands & celebrities" },
  { to: "/artist/onboarding", label: "Artist Account", icon: Mic2, hint: "Claim your official music profile" },
  { to: "/profile/edit", label: "Username & identity", icon: AtSign },
  { to: "/settings/security", label: "Password & security", icon: KeyRound, hint: "Password, recovery, and login protection" },
];

function AccountSettings() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname !== "/settings/account") return <Outlet />;

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
            const inner = (
              <>
                <div className="ring-1 ring-primary/20 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{item.label}</div>
                    {item.soon && (
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Soon</span>
                    )}
                  </div>
                  {item.hint && <div className="truncate text-[11px] text-muted-foreground">{item.hint}</div>}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            );
            const cls = `flex items-center gap-3 px-4 py-3.5 active:bg-primary/5 ${i > 0 ? "border-t border-border/40" : ""}`;
            return item.to ? (
              <Link key={item.label} to={item.to} className={cls}>{inner}</Link>
            ) : (
              <button key={item.label} onClick={() => toast.info(`${item.label} is coming soon`)} className={`${cls} text-left w-full`}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
