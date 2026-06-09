import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Coins, ArrowDownToLine, Plus, TrendingUp, Clock, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { TopUpDialog } from "@/components/TopUpDialog";
import { PayoutRequestDialog, coinsToUsd } from "@/components/PayoutRequestDialog";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Wallet · Javan" }] }),
  component: WalletPage,
});

const MIN_PAYOUT = 2000; // $20 at 100 coins = $1

function WalletPage() {
  const { profile, user } = useAuth();

  const { data: purchases = [] } = useQuery({
    queryKey: ["coin-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("coin_purchases").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["payout-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("payout_requests").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

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

  const coins = profile?.coins ?? 0;
  const earned = profile?.earned_coins ?? 0;
  const usd = coinsToUsd(earned).toFixed(2);
  const canPayout = earned >= MIN_PAYOUT;

  return (
    <MobileShell>
      <div className="px-5 pt-6">
        <h1 className="font-display text-3xl font-bold">Wallet</h1>

        {/* Balance card */}
        <div className="bg-gradient-primary relative mt-5 overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-glow">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">Coin balance</div>
          <div className="mt-2 flex items-end gap-2">
            <Coins className="mb-1 h-8 w-8" />
            <span className="font-display text-5xl font-bold">{coins.toLocaleString()}</span>
          </div>
          <div className="mt-1 text-xs opacity-70">≈ ${coinsToUsd(coins).toFixed(2)} USD · 100 coins = $1.00</div>

          <TopUpDialog>
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/25">
              <Plus className="h-4 w-4" /> Add coins
            </button>
          </TopUpDialog>
        </div>

        {/* Earnings */}
        <div className="glass mt-5 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Creator earnings</div>
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-3xl font-bold text-gradient">${usd}</span>
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" /> 80% creator share
            </span>
          </div>
          <div className="text-xs text-muted-foreground">{earned.toLocaleString()} coins earned · withdraw from $20</div>


          <PayoutRequestDialog earnedCoins={earned}>
            <button
              disabled={!canPayout}
              className="bg-gradient-gold mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-background shadow-glow disabled:opacity-50"
            >
              <ArrowDownToLine className="h-4 w-4" /> Request payout
            </button>
          </PayoutRequestDialog>

          <p className="mt-2 text-[11px] text-muted-foreground">
            Minimum withdrawal $20 ({MIN_PAYOUT.toLocaleString()} coins). 7-day fraud hold, then admin review.
          </p>

        </div>

        {/* History */}
        <div className="mt-6 space-y-4">
          <Section title="Top-ups" empty="No purchases yet.">
            {purchases.map((p: any) => (
              <Row
                key={p.id}
                left={<><Plus className="h-3.5 w-3.5 text-primary" /> +{p.coins.toLocaleString()} coins</>}
                middle={`$${(p.usd_cents / 100).toFixed(2)} · ${new Date(p.created_at).toLocaleDateString()}`}
                status={p.status}
              />
            ))}
          </Section>

          <Section title="Payouts" empty="No payouts requested yet.">
            {payouts.map((p: any) => (
              <Row
                key={p.id}
                left={<><ArrowDownToLine className="h-3.5 w-3.5 text-gold" /> ${(p.usd_cents / 100).toFixed(2)}</>}
                middle={`${p.payout_method.toUpperCase()} · ${new Date(p.created_at).toLocaleDateString()}`}
                status={p.status}
              />
            ))}
          </Section>
        </div>
      </div>
    </MobileShell>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: any }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.filter(Boolean).length > 0;
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="glass divide-y divide-border/40 overflow-hidden rounded-2xl">
        {hasItems ? children : <div className="p-4 text-center text-xs text-muted-foreground">{empty}</div>}
      </div>
    </div>
  );
}

function Row({ left, middle, status }: { left: any; middle: string; status: string }) {
  const tone =
    status === "succeeded" || status === "paid" ? "text-accent" :
    status === "approved" ? "text-primary" :
    status === "failed" || status === "rejected" || status === "refunded" ? "text-destructive" :
    "text-muted-foreground";
  const Icon =
    status === "succeeded" || status === "paid" || status === "approved" ? CheckCircle2 :
    status === "failed" || status === "rejected" ? XCircle :
    Clock;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
      <div className="flex items-center gap-1.5 font-semibold">{left}</div>
      <div className="flex-1 truncate text-muted-foreground">{middle}</div>
      <div className={`flex items-center gap-1 font-semibold ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
        {status}
      </div>
    </div>
  );
}
