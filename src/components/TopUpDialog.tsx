import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, CreditCard, Sparkles, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const PACKAGES = [
  { coins: 500, usd: 4.99, label: "Starter" },
  { coins: 1500, usd: 12.99, label: "Popular", bonus: "+10%", best: true },
  { coins: 5000, usd: 39.99, label: "Pro", bonus: "+15%" },
  { coins: 15000, usd: 99.99, label: "Whale", bonus: "+25%" },
];

export function TopUpDialog({ children }: { children: React.ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<typeof PACKAGES[number]>(PACKAGES[1]);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!card.number.replace(/\s/g, "").match(/^\d{13,19}$/)) return toast.error("Enter a valid card number");
    if (!card.exp.match(/^\d{2}\/\d{2}$/)) return toast.error("Expiry must be MM/YY");
    if (!card.cvc.match(/^\d{3,4}$/)) return toast.error("Enter a valid CVC");
    if (!card.name.trim()) return toast.error("Enter the cardholder name");

    setSubmitting(true);
    // Record the purchase intent. A real Stripe charge would happen via a server function
    // and update this row to status='succeeded' from the webhook.
    const { error } = await supabase.from("coin_purchases").insert({
      user_id: user.id,
      coins: selected.coins,
      usd_cents: Math.round(selected.usd * 100),
      provider: "stripe",
      status: "pending",
    });
    if (error) { setSubmitting(false); return toast.error(error.message); }

    toast.success("Top-up queued for processing", {
      description: "Your coins will appear shortly after payment is confirmed.",
    });
    setSubmitting(false);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["coin-purchases"] });
    await refreshProfile();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-primary" /> Add coins
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {PACKAGES.map((p) => {
            const active = selected.coins === p.coins;
            return (
              <button
                key={p.coins}
                onClick={() => setSelected(p)}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  active ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"
                }`}
              >
                {p.best && (
                  <span className="bg-gradient-primary absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                    Best
                  </span>
                )}
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.label}</div>
                <div className="font-display mt-1 flex items-center gap-1 text-2xl font-bold">
                  <Coins className="h-5 w-5 text-primary" /> {p.coins.toLocaleString()}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">${p.usd.toFixed(2)}</span>
                  {p.bonus && <span className="text-accent font-semibold">{p.bonus}</span>}
                </div>
                {active && (
                  <Check className="text-primary absolute right-2 top-2 h-4 w-4" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4" /> Card details
          </div>
          <input
            value={card.number}
            onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 23) })}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            className="glass w-full rounded-xl px-4 py-3 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={card.exp}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                setCard({ ...card, exp: v });
              }}
              placeholder="MM/YY"
              inputMode="numeric"
              className="glass rounded-xl px-4 py-3 text-sm outline-none"
            />
            <input
              value={card.cvc}
              onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/[^\d]/g, "").slice(0, 4) })}
              placeholder="CVC"
              inputMode="numeric"
              className="glass rounded-xl px-4 py-3 text-sm outline-none"
            />
          </div>
          <input
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })}
            placeholder="Cardholder name"
            className="glass w-full rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="bg-gradient-primary mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {submitting ? "Processing…" : `Pay $${selected.usd.toFixed(2)} · ${selected.coins.toLocaleString()} coins`}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">
          Payments are processed securely. Card details are never stored on Admiralty servers.
        </p>
      </DialogContent>
    </Dialog>
  );
}
