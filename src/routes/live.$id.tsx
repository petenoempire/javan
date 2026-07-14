import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Heart,
  Send,
  Gift as GiftIcon,
  Users,
  BadgeCheck,
  X,
  Radio,
  Video as VideoIcon,
  RotateCw,
  Wand2,
  Sliders,
  Settings,
  HeartHandshake,
  UserPlus,
  MessageSquare,
  Share2,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchStream, postChat, postHeart, postJoin, endStream } from "@/lib/live";
import { LiveChat } from "@/components/LiveChat";
import { GiftPanel } from "@/components/GiftPanel";
import { toast } from "sonner";

export const Route = createFileRoute("/live/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ host: s.host === "1" ? "1" : undefined }),
  head: () => ({ meta: [{ title: "Live Stream · Javan" }] }),
  component: LivePage,
});

interface GiftAnimationConfig {
  id: string;
  name: string;
  cost: number;
  animationType: "badge" | "overlay" | "screen-shake" | "stampede" | "roar";
  emoji: string;
}

const PREMIUM_GIFTS: Record<string, GiftAnimationConfig> = {
  javan_cap: { id: "javan_cap", name: "Javan Cap", cost: 10, animationType: "badge", emoji: "🧢" },
  bucket: { id: "bucket", name: "Bucket", cost: 50, animationType: "overlay", emoji: "🪣" },
  cub: { id: "cub", name: "Cub", cost: 500, animationType: "overlay", emoji: "🦁" },
  lioness: { id: "lioness", name: "Lioness", cost: 250000, animationType: "screen-shake", emoji: "👑" },
  hisense_tv: { id: "hisense_tv", name: "Hisense Smart TV", cost: 500000, animationType: "screen-shake", emoji: "📺" },
  hippopotamus: { id: "hippopotamus", name: "Hippopotamus", cost: 1000000, animationType: "stampede", emoji: "🦛" },
  lion: { id: "lion", name: "Lion", cost: 1500000, animationType: "roar", emoji: "🦁" },
  elephant: { id: "elephant", name: "Elephant", cost: 2500000, animationType: "stampede", emoji: "🐘" },
};

function LivePage() {
  const { id } = Route.useParams();
  const { host: hostMode } = useSearch({ from: "/live/$id" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const [viewers, setViewers] = useState(0);
  const [hostStream, setHostStream] = useState<MediaStream | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);

  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftAnimationConfig | null>(null);
  const [trayStates, setTrayStates] = useState({
    flip: false,
    beautify: false,
    effects: false,
    settings: false,
    service: false,
    fanclub: false,
    interact: false,
    share: false,
    promote: false,
  });

  const { data: stream } = useQuery({
    queryKey: ["live-stream", id],
    queryFn: () => fetchStream(id),
    refetchInterval: 15000,
  });

  const isHost = !!user && stream?.host_id === user.id;
  const wantHost = isHost && hostMode === "1";

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`live-gifts-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat_messages", filter: `stream_id=eq.${id}` },
        (payload: any) => {
          if (payload.new?.kind === "gift") {
            const matchedGift = PREMIUM_GIFTS[payload.new.gift_key];
            if (matchedGift) {
              setActiveGiftAnimation(matchedGift);
              setTimeout(() => setActiveGiftAnimation(null), 4500);
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`live-presence-${id}`, { config: { presence: { key: user.id } } });
    channel
      .on("presence", { event: "sync" }, () => setViewers(Object.keys(channel.presenceState()).length))
      .on("broadcast", { event: "heart" }, () => setHearts((h) => [...h, Date.now() + Math.random()]))
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
          if (!isHost) postJoin(id, user.id).catch(() => {});
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user?.id, isHost]);

  const handleControlTrayAction = (key: keyof typeof trayStates) => {
    setTrayStates((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} ${trayStates[key] ? "disabled" : "enabled"}`);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    try {
      await postChat(id, user!.id, input);
      setInput("");
      toast.success("Message sent");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleSendHeart = async () => {
    try {
      await postHeart(id, user!.id);
      const channel = supabase.channel(`live-presence-${id}`);
      channel.send({ type: "broadcast", event: "heart", payload: {} });
    } catch (err) {
      toast.error("Failed to send heart");
    }
  };

  const handleCloseStream = async () => {
    if (!isHost) return navigate({ to: "/" });
    try {
      await endStream(id);
      toast.success("Stream ended");
      navigate({ to: "/profile" });
    } catch (err) {
      toast.error("Failed to end stream");
    }
  };

  if (!stream) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white text-xs uppercase animate-pulse">
        Loading stream...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen flex-col overflow-hidden bg-black text-white">
      {/* Gift Animation Overlay */}
      <AnimatePresence>
        {activeGiftAnimation && (
          <motion.div
            key={activeGiftAnimation.id}
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-8xl font-black"
              initial={{ scale: 0, y: 100 }}
              animate={{
                scale: activeGiftAnimation.animationType === "roar" ? [1, 1.5, 1] : 1,
                y: activeGiftAnimation.animationType === "stampede" ? [100, -50, 0] : 0,
              }}
              transition={{ duration: 2 }}
            >
              {activeGiftAnimation.emoji}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Stream */}
      <div className="absolute inset-0">
        {wantHost && hostStream ? (
          <video ref={hostVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-black to-neutral-900">
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 mb-4 animate-pulse" />
              <p className="text-xs text-white/50">Loading stream...</p>
            </div>
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3">
        <button
          onClick={handleCloseStream}
          className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-black/60 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-3 w-3" /> Exit
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-red-500/30 px-3 py-1.5 text-xs font-black text-red-400">
            <Radio className="h-2 w-2 animate-pulse" /> LIVE
          </div>
          <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 text-xs font-bold text-white">
            <Users className="h-3 w-3" /> {viewers.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Control Tray - 2 Rows of 5 Buttons */}
      <div className="relative z-10 mx-auto mt-auto flex w-full max-w-[520px] flex-col gap-2 px-3 pb-4">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 grid grid-cols-5 gap-1">
          {[
            { key: "flip", label: "Flip", icon: RotateCw },
            { key: "beautify", label: "Beautify", icon: Wand2 },
            { key: "effects", label: "Effects", icon: Sliders },
            { key: "settings", label: "Settings", icon: Settings },
            { key: "service", label: "Service", icon: HeartHandshake },
          ].map(({ key, label, icon: Icon }) => {
            const k = key as keyof typeof trayStates;
            return (
              <button
                key={k}
                onClick={() => handleControlTrayAction(k)}
                className={`flex flex-col items-center justify-center rounded-xl p-2 border transition-all duration-150 active:scale-90 ${
                  trayStates[k]
                    ? "bg-emerald-600/30 border-emerald-400 text-emerald-300"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                }`}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[7px] uppercase mt-0.5 font-black">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 grid grid-cols-5 gap-1">
          {[
            { key: "fanclub", label: "Fan Club", icon: UserPlus },
            { key: "interact", label: "Interact", icon: MessageSquare },
            { key: "share", label: "Share", icon: Share2 },
            { key: "promote", label: "Promote", icon: TrendingUp },
            { key: "gift", label: "Gifts", icon: GiftIcon, action: () => setGiftOpen(!giftOpen) },
          ].map(({ key, label, icon: Icon, action }) => {
            const k = key as keyof typeof trayStates;
            return (
              <button
                key={k}
                onClick={action ? action : () => handleControlTrayAction(k)}
                className={`flex flex-col items-center justify-center rounded-xl p-2 border transition-all duration-150 active:scale-90 ${
                  trayStates[k]
                    ? "bg-emerald-600/30 border-emerald-400 text-emerald-300"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                }`}
                title={label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[7px] uppercase mt-0.5 font-black">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Message and Heart Actions */}
        <div className="flex gap-2">
          <div className="flex-1 flex bg-black/40 backdrop-blur-md border border-white/10 rounded-full items-center px-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Say something..."
              className="flex-1 bg-transparent py-2 text-xs outline-none text-white placeholder:text-white/40"
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 text-white/70 hover:text-white active:scale-90 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleSendHeart}
            className="flex items-center justify-center rounded-full bg-rose-600/30 border border-rose-400 w-10 h-10 text-rose-300 hover:text-rose-200 active:scale-90 transition-all"
          >
            <Heart className="h-4 w-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Gift Panel */}
      {giftOpen && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
          <GiftPanel gifts={PREMIUM_GIFTS} onClose={() => setGiftOpen(false)} streamId={id} />
        </div>
      )}

      {/* Floating Hearts Animation */}
      <AnimatePresence>
        {hearts.map((id) => (
          <motion.div
            key={id}
            className="absolute pointer-events-none"
            initial={{ x: Math.random() * 50 - 25, y: window.innerHeight - 100, opacity: 1 }}
            animate={{ y: window.innerHeight - 300, opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
