import { useState } from "react";
import { Loader2, X, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { sendSuperChat } from "@/lib/live";
import { toast } from "sonner";

interface SuperChatPanelProps {
  streamId: string;
  onClose: () => void;
  onSent?: () => void;
}

const TIERS = [
  { coins: 100, label: "Supporter", color: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200" },
  {
    coins: 500,
    label: "Spotlight",
    color: "border-purple-400/40 bg-purple-400/10 text-purple-200",
  },
  { coins: 1000, label: "Front row", color: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  { coins: 5000, label: "Headliner", color: "border-rose-400/40 bg-rose-400/10 text-rose-200" },
];

export function SuperChatPanel({ streamId, onClose, onSent }: SuperChatPanelProps) {
  const { user, profile } = useAuth();
  const [coins, setCoins] = useState(500);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const send = async () => {
    if (!user) {
      toast.error("Sign in to send a Super Chat");
      return;
    }
    if (!body.trim()) {
      toast.error("Write a message first");
      return;
    }
    if ((profile?.coins ?? 0) < coins) {
      toast.error("Not enough coins");
      return;
    }
    setIsSending(true);
    try {
      await sendSuperChat(streamId, body, coins);
      toast.success(`Super Chat sent for ${coins.toLocaleString()} coins`);
      setBody("");
      onSent?.();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Could not send Super Chat");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full rounded-t-3xl border-t border-amber-300/20 bg-gradient-to-t from-black via-black/95 to-black/80 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.45)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-black text-white">
            <Zap className="h-4 w-4 fill-amber-300 text-amber-300" /> Super Chat
          </h3>
          <p className="mt-0.5 text-[11px] text-white/50">
            Highlight your message for the creator and room.
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close Super Chat"
          className="text-white/50 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier.coins}
            onClick={() => setCoins(tier.coins)}
            className={`rounded-xl border px-2 py-2 text-center transition-all ${tier.color} ${coins === tier.coins ? "ring-2 ring-white/70" : "opacity-70"}`}
          >
            <div className="text-xs font-black">{tier.coins.toLocaleString()}</div>
            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide">{tier.label}</div>
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value.slice(0, 240))}
          placeholder="Say something memorable…"
          rows={2}
          className="min-h-[46px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          onClick={send}
          disabled={isSending}
          className="flex h-10 items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-3 text-xs font-black text-black disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 fill-current" />
          )}
          Send
        </button>
      </div>
      <div className="mt-2 text-right text-[10px] text-white/40">
        Balance: {(profile?.coins ?? 0).toLocaleString()} coins
      </div>
    </div>
  );
}
