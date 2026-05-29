import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { Coins, ArrowDownToLine, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet · Admiralty" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { profile, user } = useAuth();

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <Coins className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold">Sign in to view wallet</h2>
          <Link to="/auth" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Sign in</Link>
        </div>
      </MobileShell>
    );
  }

  const usd = ((profile?.earned_coins ?? 0) / 100).toFixed(2);

  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>

        <div className="bg-gradient-primary relative mt-5 overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-glow">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="text-xs uppercase tracking-wider opacity-80">Coin balance</div>
          <div className="mt-2 flex items-end gap-2">
            <Coins className="mb-1 h-7 w-7" />
            <span className="font-display text-5xl font-bold">{(profile?.coins ?? 0).toLocaleString()}</span>
          </div>
          <div className="mt-4 text-xs opacity-80">Top-ups via Stripe will be available soon.</div>
        </div>

        <div className="glass mt-5 rounded-3xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Creator earnings</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-gradient">${usd}</span>
          </div>
          <div className="text-xs text-muted-foreground">{(profile?.earned_coins ?? 0).toLocaleString()} coins earned</div>
          <button disabled className="bg-gradient-gold mt-4 inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold text-background shadow-glow disabled:opacity-50">
            <ArrowDownToLine className="h-4 w-4" /> Request payout
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">Payouts unlock once your account is verified and you've earned at least 10,000 coins.</p>
        </div>

        {!profile?.is_verified && (
          <Link to="/verify" className="glass mt-5 flex items-center gap-3 rounded-2xl p-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Get verified to enable payouts</div>
              <div className="text-xs text-muted-foreground">Submit ID or business documents for manual review.</div>
            </div>
            <span className="text-xs font-semibold text-primary">Start →</span>
          </Link>
        )}
      </div>
    </MobileShell>
  );
}
