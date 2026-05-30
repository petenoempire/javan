import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowDownToLine, Building2, Wallet as WalletIcon, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const MIN_COINS = 10000;

export function PayoutRequestDialog({ children, earnedCoins, verified }: { children: React.ReactNode; earnedCoins: number; verified: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [coins, setCoins] = useState(MIN_COINS);
  const [method, setMethod] = useState<"paypal" | "bank" | "stripe">("paypal");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const usd = (coins / 100).toFixed(2);

  const submit = async () => {
    if (!user) return;
    if (!verified) return toast.error("Account must be verified before requesting payouts.");
    if (coins < MIN_COINS) return toast.error(`Minimum payout is ${MIN_COINS.toLocaleString()} coins.`);
    if (coins > earnedCoins) return toast.error("Amount exceeds your available earnings.");
    if (!details.trim()) return toast.error("Enter your payout destination details.");

    setSubmitting(true);
    const { error } = await supabase.from("payout_requests").insert({
      user_id: user.id,
      coins,
      usd_cents: coins,
      payout_method: method,
      payout_details: details.trim(),
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Payout requested", { description: "Our team will review within 3 business days." });
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["payout-requests"] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-2xl">
            <ArrowDownToLine className="h-5 w-5 text-primary" /> Request payout
          </DialogTitle>
        </DialogHeader>

        {!verified && (
          <div className="flex gap-2 rounded-2xl border border-gold/50 bg-gold/10 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-gold" />
            <div>Your account must be verified before payouts are released. Submit ID under Verify to unlock this flow.</div>
          </div>
        )}

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
              step={500}
              value={coins}
              onChange={(e) => setCoins(parseInt(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>min {MIN_COINS.toLocaleString()}</span>
              <span>available {earnedCoins.toLocaleString()}</span>
            </div>
          </div>

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { v: "paypal", label: "PayPal", Icon: WalletIcon },
              { v: "stripe", label: "Stripe", Icon: WalletIcon },
              { v: "bank", label: "Bank", Icon: Building2 },
            ] as const).map((m) => (
              <button
                key={m.v}
                onClick={() => setMethod(m.v)}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-xs font-semibold transition ${
                  method === m.v ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"
                }`}
              >
                <m.Icon className="h-4 w-4" /> {m.label}
              </button>
            ))}
          </div>

          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {method === "paypal" ? "PayPal email" : method === "stripe" ? "Stripe account email" : "Account & routing"}
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
          disabled={submitting || !verified || earnedCoins < MIN_COINS}
          className="bg-gradient-gold mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-background shadow-glow disabled:opacity-60"
        >
          {submitting ? "Submitting…" : `Request $${usd} payout`}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">
          Payouts typically process within 3–5 business days after approval.
        </p>
      </DialogContent>
    </Dialog>
  );
}
