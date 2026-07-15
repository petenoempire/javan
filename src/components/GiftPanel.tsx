import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface GiftItem {
  id: string;
  name: string;
  cost: number;
  emoji: string;
}

interface GiftPanelProps {
  gifts: Record<string, GiftItem>;
  onClose: () => void;
  streamId: string;
  hostId: string;
}

export function GiftPanel({ gifts, onClose, streamId, hostId }: GiftPanelProps) {
  const { user, profile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendGift = async (gift: GiftItem) => {
    if (!user || !profile) {
      toast.error("Sign in to send gifts");
      return;
    }

    if (!hostId) {
      toast.error("Unable to identify the streamer for this gift");
      return;
    }

    if (profile.coins < gift.cost) {
      toast.error("Not enough coins");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-gift", {
        body: {
          viewer_id: user.id,
          streamer_id: hostId,
          stream_id: streamId,
          gift_key: gift.id,
          gift_name: gift.name,
          gift_emoji: gift.emoji,
          coin_cost: gift.cost,
        },
      });

      if (error) throw new Error(error.message || "Failed to send gift");

      toast.success(`Sent ${gift.emoji} ${gift.name}!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to send gift");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-t from-black via-black/95 to-black/80 rounded-t-3xl p-4 border-t border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-white">Send a Gift</h3>
        <button onClick={onClose} className="text-white/50 hover:text-white active:scale-90">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
        {Object.values(gifts).map((gift) => (
          <button
            key={gift.id}
            onClick={() => handleSendGift(gift)}
            disabled={isProcessing}
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50"
          >
            <span className="text-2xl">{gift.emoji}</span>
            <p className="text-[9px] font-bold text-white text-center truncate">{gift.name}</p>
            <p className="text-[8px] text-amber-400 font-mono">{gift.cost.toLocaleString()}</p>
          </button>
        ))}
      </div>

      {isProcessing && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );
}
