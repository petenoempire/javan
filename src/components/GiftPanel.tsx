import { motion, AnimatePresence } from "motion/react";
import { X, Coins } from "lucide-react";
import { gifts, type Gift } from "@/lib/mock";
import { useWallet } from "@/lib/store";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function GiftPanel({ open, onClose, onSend, recipientId }: { open: boolean; onClose: () => void; onSend: (g: Gift) => void; recipientId?: string }) {
  const { coins, refetch } = useWallet();
  const [selected, setSelected] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const send = async (g: Gift) => {
    if (!recipientId) { toast.error("No recipient"); return; }
    if (coins < g.cost) { toast.error("Insufficient coins"); return; }
    setSending(true);
    const { error } = await supabase.rpc("send_gift", { _recipient: recipientId, _gift_key: g.id });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setSelected(g.id);
    onSend(g);
    refetch();
    setTimeout(() => setSelected(null), 500);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="glass-strong fixed bottom-0 left-1/2 z-50 w-[min(480px,100vw)] -translate-x-1/2 rounded-t-3xl p-5 pb-8 shadow-elegant"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Send a gift</h3>
              <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-gold flex h-9 w-9 items-center justify-center rounded-full">
                  <Coins className="h-5 w-5 text-background" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="font-display font-bold">{coins.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => topUp(500)}
                className="bg-gradient-primary rounded-full px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow active:scale-95"
              >
                Top up
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {gifts.map((g) => {
                const tierRing =
                  g.tier === "legendary" ? "ring-2 ring-gold" :
                  g.tier === "rare" ? "ring-2 ring-primary" : "";
                return (
                  <button
                    key={g.id}
                    onClick={() => send(g)}
                    disabled={coins < g.cost}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl border border-border bg-card/60 p-3 transition active:scale-95 disabled:opacity-40 ${tierRing} ${selected === g.id ? "scale-110" : ""}`}
                  >
                    <div className="text-3xl">{g.icon}</div>
                    <div className="text-xs font-medium">{g.name}</div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Coins className="h-2.5 w-2.5" /> {g.cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
