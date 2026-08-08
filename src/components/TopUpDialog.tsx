import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import React, { ReactNode } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TopUpDialogProps {
  children: ReactNode;
  onSubmit?: (coinAmount: number) => void;
  isSubmitting?: boolean;
  currentBalance?: number;
}

const COIN_PACKAGES = [
  { coins: 100, usd: 1 },
  { coins: 500, usd: 4 },
  { coins: 1000, usd: 8 },
  { coins: 5000, usd: 35 },
];

export function TopUpDialog({ children, onSubmit, isSubmitting = false }: TopUpDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedPackage, setSelectedPackage] = React.useState<(typeof COIN_PACKAGES)[0]>(COIN_PACKAGES[0]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      if (onSubmit) {
        onSubmit(selectedPackage.coins);
        setOpen(false);
        return;
      }
      const response = await fetch("/api/v1/wallet/purchase-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coins: selectedPackage.coins,
          usd_cents: selectedPackage.usd * 100,
        }),
      });

      if (!response.ok) throw new Error("Purchase failed");
      toast.success(`Purchased ${selectedPackage.coins} coins!`);
      setOpen(false);
    } catch (err) {
      toast.error("Purchase failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-[#020210] border-white/10 text-white max-w-md rounded-[2.5rem] shadow-glow">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-chrome tracking-tight">Purchase Coins</DialogTitle>
          <DialogDescription className="text-white/40">Select a package to add coins to your cosmic wallet.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {COIN_PACKAGES.map((pkg) => (
            <button
              key={pkg.coins}
              onClick={() => setSelectedPackage(pkg)}
              className={`w-full flex items-center justify-between rounded-xl p-3 border transition-all ${
                selectedPackage.coins === pkg.coins
                  ? "bg-fuchsia-600/20 border-fuchsia-500"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <span className="font-bold">{pkg.coins.toLocaleString()} Coins</span>
              <span className="text-sm text-white/70">${pkg.usd}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handlePurchase}
          disabled={isProcessing || isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-4 font-black text-white shadow-glow disabled:opacity-50 active:scale-95 transition-all"
        >
          {isProcessing || isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" /> Purchase
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  );
}
