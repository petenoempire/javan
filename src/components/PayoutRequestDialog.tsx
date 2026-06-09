import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowDownToLine, Building2, Wallet as WalletIcon, ShieldCheck, Clock, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

const MIN_COINS = 2000; // $20 at 100 coins = $1
// 100 coins = $1.00 USD (1 coin = $0.01)
export const coinsToUsd = (coins: number) => coins / 100;
const usdCentsOf = (coins: number) => coins;

type PayoutMethod = "paypal" | "bank" | "payoneer" | "stripe";

export function PayoutRequestDialog({ children, earnedCoins }: { children: React.ReactNode; earnedCoins: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [coins, setCoins] = useState(MIN_COINS);
  const [method, setMethod] = useState<PayoutMethod>("paypal");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: verified } = useQuery({
    queryKey: ["verification-status", user?.id],
    enabled: !!user && open,
    queryFn: async () => {
      const { data } = await supabase.from("verifications")
        .select("status").eq("user_id", user!.id).eq("status", "approved").maybeSingle();
      return !!data;
    },
  });

  const usd = coinsToUsd(coins).toFixed(2);

  const submit = async () => {
    if (!user) return;
    if (!verified) return toast.error("Identity verification required before withdrawals.");
    if (coins < MIN_COINS) return toast.error(`Minimum withdrawal is $20.00 (${MIN_COINS.toLocaleString()} coins).`);
    if (coins > earnedCoins) return toast.error("Amount exceeds your available earnings.");
    if (!details.trim()) return toast.error("Enter your payout destination details.");

    setSubmitting(true);
    const { error } = await supabase.rpc("request_payout", {
      _coins: coins,
      _method: method,
      _details: details.trim(),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Withdrawal requested", {
      description: "Funds enter a 7-day fraud hold, then queue for admin review.",
    });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["payout-requests"] });
    qc.invalidateQueries({ queryKey: ["wallet"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-2xl">
            <ArrowDownToLine className="h-5 w-5 text-primary" /> Request withdrawal
          </DialogTitle>
        </DialogHeader>

        {verified === false ? (
          <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Verification required</div>
            <p className="text-xs text-muted-foreground">
              Submit identity verification before requesting a withdrawal. This protects creators and reduces chargebacks.
            </p>
            <Link to="/settings/account/verification" onClick={() => setOpen(false)}
              className="bg-gradient-primary inline-flex w-full items-center justify-center rounded-xl py-2.5 text-xs font-bold text-primary-foreground shadow-glow">
              Start verification
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2 rounded-2xl border border-primary/40 bg-primary/5 p-3 text-xs">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <span className="font-semibold">7-day fraud hold.</span> Withdrawals are held for 7 days before admin review. Minimum payout is <span className="font-semibold">$20.00</span>. Creators earn 80% of gifted coin value.
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</label>
              <div className="glass rounded-2xl p-4">
                <div className="font-display flex items-end justify-between">
                  <span className="text-3xl font-bold">${usd}</span>
                  <span className="text-xs text-muted-foreground">{coins.toLocaleString()} coins</span>
                </div>
                <input
                  type="range"
                  min={MIN_COINS}
                  max={Math.max(earnedCoins, MIN_COINS)}
                  step={100}
                  value={coins}
                  onChange={(e) => setCoins(parseInt(e.target.value))}
                  className="mt-3 w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>min {MIN_COINS.toLocaleString()} ($20)</span>
                  <span>available {earnedCoins.toLocaleString()}</span>
                </div>
              </div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { v: "paypal", label: "PayPal", Icon: WalletIcon },
                  { v: "payoneer", label: "Payoneer", Icon: WalletIcon },
                  { v: "stripe", label: "Stripe", Icon: WalletIcon },
                  { v: "bank", label: "Bank", Icon: Landmark },
                ] as const).map((m) => (
                  <button
                    key={m.v}
                    onClick={() => setMethod(m.v)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-[10px] font-semibold transition ${
                      method === m.v ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <m.Icon className="h-4 w-4" /> {m.label}
                  </button>
                ))}
              </div>

              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {method === "bank" ? "Account & routing" : `${method === "paypal" ? "PayPal" : method === "payoneer" ? "Payoneer" : "Stripe"} email`}
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder={method === "bank" ? "Account holder, account #, routing/IBAN, SWIFT/BIC" : "you@example.com"}
                className="glass w-full rounded-xl px-4 py-3 text-sm outline-none"
              />
            </div>

            <button
              onClick={submit}
              disabled={submitting || earnedCoins < MIN_COINS}
              className="bg-gradient-gold mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-background shadow-glow disabled:opacity-60"
            >
              {submitting ? "Submitting…" : `Request $${usd} withdrawal`}
            </button>
            <p className="text-center text-[10px] text-muted-foreground">
              Funds release after the 7-day hold and admin approval (typically 3 business days afterward).
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
