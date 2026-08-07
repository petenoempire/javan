import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import {
  Coins, ArrowDownToLine, Plus, TrendingUp, Clock, CheckCircle2, XCircle,
  Sparkles, RefreshCw, Landmark, AlertCircle, ChevronDown, Wallet,
  DollarSign, Gift, ArrowLeft, ArrowUpRight, ArrowDownLeft, Filter
} from "lucide-react";
import { TopUpDialog } from "@/components/TopUpDialog";
import { PayoutRequestDialog, coinsToUsd } from "@/components/PayoutRequestDialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const PAGE_TITLE = "Creator Wallet · Javan";
const PAGE_DESC = "Manage your Javan coin balance, purchase coins, and request creator payouts.";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESC },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESC },
      { property: "og:url", content: "https://javan.lovable.app/wallet" },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/wallet" }],
  }),
  component: WalletPage,
});

const MIN_PAYOUT_COINS = 2000;
type CurrencyTier = "USD" | "GBP" | "NGN" | "EUR" | "CAD" | "AUD" | "INR" | "ZAR" | "GHS" | "KES" | "AED" | "SAR" | "JPY" | "CNY" | "SGD" | "MYR" | "BRL" | "MXN";

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
};

function WalletPage() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeCurrency, setActiveCurrency] = useState<CurrencyTier>("USD");
  const [processingLock, setProcessingLock] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const currentFx = useMemo(() => FIAT_FX_RATES[activeCurrency], [activeCurrency]);

  const earned = useMemo(() => {
    return profile?.earned_coins ?? 0;
  }, [profile]);

  const canPayout = earned >= MIN_PAYOUT_COINS && !processingLock;

  const executeWithdrawalMutation = useMutation({
    mutationFn: async ({ coinAmount, method, accountInfo }: { coinAmount: number; method: string; accountInfo: string }) => {
      const { data, error } = await supabase
        .from("payout_requests")
        .insert({
          user_id: user!.id,
          payout_method: method.toLowerCase(),
          coin_amount: coinAmount,
          usd_cents: Math.round(coinsToUsd(coinAmount) * 100),
          status: "pending",
          account_info: accountInfo,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Payout request submitted. Processing in 1-3 business days.");
      queryClient.invalidateQueries({ queryKey: ["payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["creator-profile"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Payout request failed");
    },
  });

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

  const topUpMutation = useMutation({
    mutationFn: async (coinAmount: number) => {
      const { data, error } = await supabase
        .from("coin_purchases")
        .insert({
          user_id: user!.id,
          coin_amount: coinAmount,
          usd_cents: Math.round(coinsToUsd(coinAmount) * 100),
          status: "succeeded",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Coins added successfully!");
      queryClient.invalidateQueries({ queryKey: ["coin-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["creator-profile"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Top-up failed");
    },
  });

  return (
    <div className="fixed inset-0 z-[60] bg-[#020210] flex flex-col overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <button onClick={() => navigate({ to: "/profile" })} className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-all" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1">
          <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest">Finance</p>
          <h1 className="font-display text-lg font-black text-chrome">Wallet</h1>
        </div>
        {/* Currency Picker */}
        <button
          onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/80 active:scale-90"
        >
          {currentFx.symbol} {activeCurrency}
          <ChevronDown className={`h-3 w-3 transition-transform ${showCurrencyPicker ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Currency Picker Dropdown */}
      <AnimatePresence>
        {showCurrencyPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl max-h-[300px] overflow-y-auto"
          >
            <div className="grid grid-cols-3 gap-2 p-3">
              {(Object.keys(FIAT_FX_RATES) as CurrencyTier[]).map((curr) => (
                <button
                  key={curr}
                  onClick={() => { setActiveCurrency(curr); setShowCurrencyPicker(false); }}
                  className={`rounded-lg px-3 py-2 text-xs font-bold text-center transition-all active:scale-90 ${
                    activeCurrency === curr
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className="block">{FIAT_FX_RATES[curr].symbol}</span>
                  <span className="block text-[9px] mt-0.5">{curr}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 pb-8">
        {/* Balance Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Coin Balance</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-2.5 w-2.5" /> 80% Share
            </span>
          </div>
          <div className="text-4xl font-black text-white mb-1">{earned.toLocaleString()}</div>
          <div className="text-sm text-white/40">
            {earned.toLocaleString()} coins earned
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-white/30">
            <Coins className="h-3 w-3" />
            Min to cash out: {MIN_PAYOUT_COINS.toLocaleString()} coins
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <TopUpDialog
            onSubmit={(coinAmount) => topUpMutation.mutate(coinAmount)}
            isSubmitting={topUpMutation.isPending}
            currentBalance={earned}
          >
            <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 py-3 text-sm font-bold text-emerald-400 active:scale-95 transition-all">
              <Plus className="h-4 w-4" /> Top Up
            </button>
          </TopUpDialog>
          <PayoutRequestDialog
            earnedCoins={earned}
            isSubmitting={executeWithdrawalMutation.isPending}
            onSubmit={({ coinAmount, method, accountInfo }) =>
              executeWithdrawalMutation.mutate({ coinAmount, method, accountInfo })
            }
          >
            <button
              disabled={!canPayout || processingLock}
              className="flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/10 py-3 text-sm font-bold text-white/70 active:scale-95 transition-all disabled:opacity-30"
            >
              <ArrowDownToLine className="h-4 w-4" /> Payout
            </button>
          </PayoutRequestDialog>
        </div>

        {/* Fee Notice */}
        <div className="flex gap-2 items-start mb-6 rounded-xl bg-white/5 border border-white/5 p-3">
          <AlertCircle className="h-3.5 w-3.5 text-white/30 shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/40 leading-relaxed">
            Payouts include a 2.5% platform processing fee. Requests take 1-3 business days to process.
          </p>
        </div>

        {/* Transaction History */}
        <div className="space-y-5">
          {/* Purchases */}
          <TransactionSection title="Purchases" empty="No purchases yet.">
            {purchases.map((p: any) => (
              <TransactionRow
                key={p.id}
                icon={ArrowUpRight}
                iconColor="text-emerald-400"
                label={`+${p.coins?.toLocaleString() ?? p.coin_amount?.toLocaleString()} Coins`}
                detail={`${currentFx.symbol}${((p.usd_cents / 100) * currentFx.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${activeCurrency} · ${new Date(p.created_at).toLocaleDateString()}`}
                status={p.status}
              />
            ))}
          </TransactionSection>

          {/* Payouts */}
          <TransactionSection title="Payouts" empty="No payout history.">
            {payouts.map((p: any) => (
              <TransactionRow
                key={p.id}
                icon={ArrowDownLeft}
                iconColor="text-amber-400"
                label={`${currentFx.symbol}${((p.usd_cents / 100) * currentFx.rate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                detail={`${p.payout_method?.toUpperCase() ?? "BANK"} · ${new Date(p.created_at).toLocaleDateString()}`}
                status={p.status}
              />
            ))}
          </TransactionSection>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   TRANSACTION COMPONENTS
   ────────────────────────────────────────────── */
function TransactionSection({ title, empty, children }: { title: string; empty: string; children: any }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.filter(Boolean).length > 0;
  return (
    <div>
      <h2 className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/40 pl-1">{title}</h2>
      <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
        {hasItems ? children : <div className="p-4 text-center text-xs text-white/30 font-medium">{empty}</div>}
      </div>
    </div>
  );
}

function TransactionRow({ icon: Icon, iconColor, label, detail, status }: {
  icon: any; iconColor: string; label: string; detail: string; status: string;
}) {
  const tone =
    status === "succeeded" || status === "paid" || status === "completed"
      ? "text-emerald-400"
      : status === "approved" || status === "pending"
      ? "text-cyan-400"
      : status === "failed" || status === "rejected"
      ? "text-rose-500"
      : "text-white/30";
  const StatusIcon =
    status === "succeeded" || status === "paid" || status === "completed" || status === "approved"
      ? CheckCircle2
      : status === "failed" || status === "rejected"
      ? XCircle
      : Clock;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        <span className="text-xs font-bold text-white">{label}</span>
      </div>
      <div className="flex-1 truncate text-white/40 font-mono text-[10px] pl-2">{detail}</div>
      <div className={`flex items-center gap-1 font-bold font-mono text-[9px] uppercase tracking-wider ${tone}`}>
        <StatusIcon className="h-3 w-3" />
        {status}
      </div>
    </div>
  );
}
