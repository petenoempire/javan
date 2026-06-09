import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, CreditCard, Sparkles, Check, Building2, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Pkg = { id: string; coins: number; usd_cents: number; label: string; sort_order: number };
type Method = "card" | "bank" | "paypal";

export function TopUpDialog({ children }: { children: React.ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>("card");
  const [selected, setSelected] = useState<Pkg | null>(null);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "", name: "" });
  const [bank, setBank] = useState({ ref: "", country: "" });
  const [paypalEmail, setPaypalEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: packages = [] } = useQuery({
    queryKey: ["coin-packages"],
    queryFn: async () => {
      const { data } = await supabase.from("coin_packages").select("*").eq("active", true).order("sort_order");
      return (data ?? []) as Pkg[];
    },
  });

  useEffect(() => {
    if (!selected && packages.length) setSelected(packages[2] ?? packages[0]);
  }, [packages, selected]);

  const usd = selected ? selected.usd_cents / 100 : 0;

  const submit = async () => {
    if (!user || !selected) return;
    if (method === "card") {
      if (!card.number.replace(/\s/g, "").match(/^\d{13,19}$/)) return toast.error("Enter a valid card number");
      if (!card.exp.match(/^\d{2}\/\d{2}$/)) return toast.error("Expiry must be MM/YY");
      if (!card.cvc.match(/^\d{3,4}$/)) return toast.error("Enter a valid CVC");
      if (!card.name.trim()) return toast.error("Enter the cardholder name");
    } else if (method === "bank" && !bank.ref.trim()) {
      return toast.error("Enter your bank reference / IBAN");
    } else if (method === "paypal" && !paypalEmail.match(/.+@.+\..+/)) {
      return toast.error("Enter a valid PayPal email");
    }

    setSubmitting(true);
    const { error } = await supabase.from("coin_purchases").insert({
      user_id: user.id,
      coins: selected.coins,
      usd_cents: selected.usd_cents,
      provider: method === "card" ? "stripe" : method,
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

        <p className="text-xs text-muted-foreground">100 coins = $1.00 USD · Send gifts to creators</p>

        <div className="grid grid-cols-2 gap-2">
          {packages.map((p) => {
            const active = selected?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`relative rounded-2xl border p-4 text-left transition ${
                  active ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.label}</div>
                <div className="font-display mt-1 flex items-center gap-1 text-2xl font-bold">
                  <Coins className="h-5 w-5 text-primary" /> {p.coins.toLocaleString()}
                </div>
                <div className="mt-1 text-xs font-semibold">${(p.usd_cents / 100).toFixed(2)}</div>
                {active && <Check className="text-primary absolute right-2 top-2 h-4 w-4" />}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          {([
            { v: "card", label: "Card", Icon: CreditCard },
            { v: "bank", label: "Bank", Icon: Landmark },
            { v: "paypal", label: "PayPal", Icon: Building2 },
          ] as const).map((m) => (
            <button
              key={m.v}
              onClick={() => setMethod(m.v)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-semibold transition ${
                method === m.v ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <m.Icon className="h-4 w-4" /> {m.label}
            </button>
          ))}
        </div>

        {method === "card" && (
          <div className="space-y-2">
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
        )}

        {method === "bank" && (
          <div className="space-y-2">
            <input value={bank.ref} onChange={(e) => setBank({ ...bank, ref: e.target.value })}
              placeholder="IBAN / Account number" className="glass w-full rounded-xl px-4 py-3 text-sm outline-none" />
            <input value={bank.country} onChange={(e) => setBank({ ...bank, country: e.target.value })}
              placeholder="Country" className="glass w-full rounded-xl px-4 py-3 text-sm outline-none" />
            <p className="text-[10px] text-muted-foreground">Bank transfers typically clear within 1–3 business days.</p>
          </div>
        )}

        {method === "paypal" && (
          <input value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)}
            placeholder="you@example.com" className="glass w-full rounded-xl px-4 py-3 text-sm outline-none" />
        )}

        <button
          onClick={submit}
          disabled={submitting || !selected}
          className="bg-gradient-primary mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {submitting ? "Processing…" : selected ? `Pay $${usd.toFixed(2)} · ${selected.coins.toLocaleString()} coins` : "Select a package"}
        </button>
        <p className="text-center text-[10px] text-muted-foreground">
          Payments are processed securely. Card details are never stored on Javan servers.
        </p>
      </DialogContent>
    </Dialog>
  );
}
