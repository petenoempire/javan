import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Coins, ArrowDownToLine, Plus, TrendingUp, Clock, CheckCircle2, XCircle, Sparkles, RefreshCw, Landmark, AlertCircle } from "lucide-react";
import { TopUpDialog } from "@/components/TopUpDialog";
import { PayoutRequestDialog, coinsToUsd } from "@/components/PayoutRequestDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [{ title: "Creator Wallet · Javan" }] }),
  component: WalletPage,
});

const MIN_PAYOUT_COINS = 2000;

type CurrencyTier =
  | "USD" | "GBP" | "NGN" | "EUR" | "CAD" | "AUD"
  | "INR" | "ZAR" | "GHS" | "KES" | "AED" | "SAR"
  | "JPY" | "CNY" | "SGD" | "MYR" | "BRL" | "MXN"
  | "CHF" | "SEK" | "NOK" | "DKK" | "PLN" | "EGP";

interface CurrencyRateMap {
  symbol: string;
  rate: number;
  name: string;
}

const FIAT_FX_RATES: Record<CurrencyTier, CurrencyRateMap> = {
  USD: { symbol: "$", rate: 1.0, name: "US Dollar" },
  GBP: { symbol: "£", rate: 0.79, name: "British Pound" },
  NGN: { symbol: "₦", rate: 1480.0, name: "Nigerian Naira" },
  EUR: { symbol: "€", rate: 0.92, name: "Euro" },
  CAD: { symbol: "C$", rate: 1.36, name: "Canadian Dollar" },
  AUD: { symbol: "A$", rate: 1.52, name: "Australian Dollar" },
  INR: { symbol: "₹", rate: 83.3, name: "Indian Rupee" },
  ZAR: { symbol: "R", rate: 18.1, name: "South African Rand" },
  GHS: { symbol: "₵", rate: 14.9, name: "Ghanaian Cedi" },
  KES: { symbol: "KSh", rate: 129.0, name: "Kenyan Shilling" },
  AED: { symbol: "د.إ", rate: 3.67, name: "UAE Dirham" },
  SAR: { symbol: "﷼", rate: 3.75, name: "Saudi Riyal" },
  JPY: { symbol: "¥", rate: 151.0, name: "Japanese Yen" },
  CNY: { symbol: "¥", rate: 7.24, name: "Chinese Yuan" },
  SGD: { symbol: "S$", rate: 1.34, name: "Singapore Dollar" },
  MYR: { symbol: "RM", rate: 4.47, name: "Malaysian Ringgit" },
  BRL: { symbol: "R$", rate: 5.03, name: "Brazilian Real" },
  MXN: { symbol: "MX$", rate: 17.1, name: "Mexican Peso" },
  CHF: { symbol: "CHF", rate: 0.88, name: "Swiss Franc" },
  SEK: { symbol: "kr", rate: 10.4, name: "Swedish Krona" },
  NOK: { symbol: "kr", rate: 10.6, name: "Norwegian Krone" },
  DKK: { symbol: "kr", rate: 6.85, name: "Danish Krone" },
  PLN: { symbol: "zł", rate: 3.98, name: "Polish Złoty" },
  EGP: { symbol: "£E", rate: 48.5, name: "Egyptian Pound" },
};

const PLATFORM_FEE_PERCENT = 0.025; // 2.5% withdrawal fee
const CREATOR_SHARE_PERCENT = 0.80; // 80% of ad revenue to creators

function WalletPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCurrency, setActiveCurrency] = useState<CurrencyTier>("USD");
  const [processingLock, setProcessingLock] = useState(false);

  const currentFx = useMemo(() => FIAT_FX_RATES[activeCurrency], [activeCurrency]);

  const { data: purchases = [] } = useQuery({
    queryKey: ["coin-purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("coin_purchases")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["payout-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const executeWithdrawalMutation = useMutation({
    mutationFn: async (payload: { coinAmount: number }) => {
      setProcessingLock(true);
      try {
        // Simulate ACID transaction with 2.5% fee
        const baseAmount = coinsToUsd(payload.coinAmount);
        const platformFee = baseAmount * PLATFORM_FEE_PERCENT;
        const userReceives = baseAmount - platformFee;

        const response = await fetch("/api/v1/wallet/request-payout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user?.id,
            coin_amount: payload.coinAmount,
            usd_amount: userReceives,
            platform_fee: platformFee,
            currency: activeCurrency,
            status: "pending",
          }),
        });

        if (!response.ok) throw new Error("Failed to process withdrawal");
        return await response.json();
      } finally {
        setProcessingLock(false);
      }
    },
    onSuccess: () => {
      toast.success("Payout request submitted. Review in 24-48 hours.");
      queryClient.invalidateQueries({ queryKey: ["coin-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Withdrawal failed. Try again.");
    },
  });

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <Coins className="mb-3 h-10 w-10 text-muted-foreground animate-bounce" />
          <h2 className="font-display text-xl font-bold">Sign in to view wallet</h2>
          <Link
            to="/auth"
            className="bg-gradient-to-r from-fuchsia-500 to-rose-500 mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            Sign in
          </Link>
        </div>
      </MobileShell>
    );
  }

  const coins = profile?.coins ?? 0;
  const earned = profile?.earned_coins ?? 0;

  const baseUsdBalance = coinsToUsd(coins);
  const localizedBalanceText = (baseUsdBalance * currentFx.rate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const baseUsdEarnings = coinsToUsd(earned);
  const localizedEarningsText = (baseUsdEarnings * currentFx.rate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const canPayout = earned >= MIN_PAYOUT_COINS;

  return (
    <MobileShell>
      <div className="px-5 pt-6 pb-24">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-black tracking-tight">Wallet</h1>
          <select
            value={activeCurrency}
            onChange={(e) => setActiveCurrency(e.target.value as CurrencyTier)}
            className="bg-neutral-900 border border-white/5 rounded-xl px-2 py-1.5 text-[10px] font-black text-white shadow-inner outline-none"
          >
            {(Object.keys(FIAT_FX_RATES) as CurrencyTier[]).map((cur) => (
              <option key={cur} value={cur} className="bg-neutral-900 text-white">
                {cur} — {FIAT_FX_RATES[cur].name}
              </option>
            ))}
          </select>
        </div>

        {/* Coin Balance Card */}
        <div className="bg-gradient-to-br from-fuchsia-600 to-rose-600 relative mt-5 overflow-hidden rounded-3xl p-6 text-white shadow-glow border border-white/10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Available Balance</div>
            {processingLock && (
              <span className="flex items-center gap-1 text-[9px] font-mono bg-black/40 px-2 py-0.5 rounded-full text-amber-300 animate-pulse border border-amber-500/20">
                <RefreshCw className="h-2 w-2 animate-spin" /> PROCESSING
              </span>
            )}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <Coins className="mb-1 h-8 w-8 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
            <span className="font-display text-5xl font-black tracking-tighter">{coins.toLocaleString()}</span>
          </div>

          <div className="mt-2 text-xs font-medium opacity-80 font-mono">
            ≈ {currentFx.symbol}{localizedBalanceText} {activeCurrency} <span className="opacity-50">(100 coins = $1 USD)</span>
          </div>

          <TopUpDialog>
            <button
              disabled={processingLock}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-black backdrop-blur-md transition-all duration-100 hover:bg-white/25 active:scale-95 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Purchase More Coins
            </button>
          </TopUpDialog>
        </div>

        {/* Creator Earnings Card */}
        <div className="mt-5 rounded-3xl p-5 border border-white/5 bg-neutral-950/40 backdrop-blur-md relative">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Creator Earnings</div>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>

          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-3xl font-black text-emerald-400">
              {currentFx.symbol}{localizedEarningsText}
            </span>
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-2.5 w-2.5" /> {Math.round(CREATOR_SHARE_PERCENT * 100)}% Share
            </span>
          </div>

          <div className="text-[11px] font-mono mt-1 text-neutral-400">
            {earned.toLocaleString()} coins earned <span className="text-neutral-600">|</span> Min to cash out: {MIN_PAYOUT_COINS.toLocaleString()} coins
          </div>

          <PayoutRequestDialog earnedCoins={earned}>
            <button
              disabled={!canPayout || processingLock}
              className="bg-emerald-500 mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black text-black shadow-glow disabled:opacity-30 active:scale-95 transition-all duration-150 hover:bg-emerald-400"
            >
              <ArrowDownToLine className="h-4 w-4" /> Request Payout
            </button>
          </PayoutRequestDialog>

          <div className="mt-3 flex gap-2 items-start border-t border-white/5 pt-3">
            <AlertCircle className="h-3.5 w-3.5 text-neutral-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
              Payouts include a 2.5% platform processing fee. Requests take 1-3 business days to process.
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-6 space-y-4">
          <Section title="Purchases" empty="No purchases yet.">
            {purchases.map((p: any) => (
              <Row
                key={p.id}
                left={
                  <>
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    +{p.coins.toLocaleString()} Coins
                  </>
                }
                middle={`${currentFx.symbol}${((p.usd_cents / 100) * currentFx.rate).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })} ${activeCurrency} · ${new Date(p.created_at).toLocaleDateString()}`}
                status={p.status}
              />
            ))}
          </Section>

          <Section title="Payouts" empty="No payout history.">
            {payouts.map((p: any) => (
              <Row
                key={p.id}
                left={
                  <>
                    <ArrowDownToLine className="h-3.5 w-3.5 text-amber-400" />
                    {currentFx.symbol}
                    {((p.usd_cents / 100) * currentFx.rate).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </>
                }
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

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: any;
}) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.filter(Boolean).length > 0;
  return (
    <div>
      <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 pl-1">{title}</div>
      <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-neutral-950/20">
        {hasItems ? children : <div className="p-4 text-center text-xs text-neutral-500 font-medium">{empty}</div>}
      </div>
    </div>
  );
}

function Row({
  left,
  middle,
  status,
}: {
  left: any;
  middle: string;
  status: string;
}) {
  const tone =
    status === "succeeded" || status === "paid" || status === "completed"
      ? "text-emerald-400"
      : status === "approved" || status === "pending"
      ? "text-cyan-400"
      : status === "failed" || status === "rejected"
      ? "text-rose-500"
      : "text-neutral-500";
  const Icon =
    status === "succeeded" || status === "paid" || status === "completed" || status === "approved"
      ? CheckCircle2
      : status === "failed" || status === "rejected"
      ? XCircle
      : Clock;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs font-medium">
      <div className="flex items-center gap-1.5 font-bold text-white">{left}</div>
      <div className="flex-1 truncate text-neutral-400 font-mono text-[11px] pl-2">{middle}</div>
      <div className={`flex items-center gap-1 font-bold font-mono text-[10px] uppercase tracking-wider ${tone}`}>
        <Icon className="h-3 w-3" />
        {status}
      </div>
    </div>
  );
}
