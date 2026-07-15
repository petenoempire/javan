import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog";
import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface PayoutRequestDialogProps {
  children: ReactNode;
  earnedCoins: number;
  onSubmit: (payload: { coinAmount: number; method: "bank" | "paypal" | "crypto"; accountInfo: string }) => void;
  isSubmitting?: boolean;
}

export const coinsToUsd = (coins: number) => coins / 100;

export function PayoutRequestDialog({ children, earnedCoins, onSubmit, isSubmitting = false }: PayoutRequestDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [method, setMethod] = React.useState<"bank" | "paypal" | "crypto">("bank");
  const [accountInfo, setAccountInfo] = React.useState("");

  const usdAmount = coinsToUsd(earnedCoins);
  const canSubmit = accountInfo.trim().length > 0 && !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ coinAmount: earnedCoins, method, accountInfo });
    setOpen(false);
    setAccountInfo("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-black border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>Withdraw your earnings</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 p-4">
            <p className="text-[10px] text-white/50 uppercase font-bold">Total Earnings</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">${usdAmount.toFixed(2)}</p>
            <p className="text-[10px] text-white/40 mt-1">2.5% fee applied = ${(usdAmount * 0.975).toFixed(2)} received</p>
          </div>

          <div>
            <label className="text-xs font-bold text-white/50 uppercase">Payment Method</label>
            <div className="mt-2 space-y-2">
              {(["bank", "paypal", "crypto"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`w-full p-2.5 text-left rounded-lg border transition-all ${
                    method === m ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <p className="text-sm font-bold capitalize">{m} Transfer</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-white/50 uppercase">Account Info</label>
            <input
              type="text"
              value={accountInfo}
              onChange={(e) => setAccountInfo(e.target.value)}
              placeholder={method === "bank" ? "Account number" : method === "paypal" ? "Email" : "Wallet address"}
              className="w-full mt-2 rounded-lg bg-white/5 border border-white/10 p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>7-day holding period before processing. Review anti-fraud checks.</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-full bg-emerald-600 py-2.5 font-bold text-white disabled:opacity-50 active:scale-95 transition-all hover:bg-emerald-500"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
