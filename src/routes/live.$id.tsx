import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, Heart, Send, Gift as GiftIcon, Users, BadgeCheck, X, Radio, 
  Video as VideoIcon, RotateCw, Wand2, Sliders, Settings, HeartHandshake, 
  UserPlus, MessageSquare, Share2, TrendingUp 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchStream, postChat, postHeart, postJoin, endStream } from "@/lib/live";
import { LiveChat } from "@/components/LiveChat";
import { GiftPanel } from "@/components/GiftPanel";
import { toast } from "sonner";

export const Route = createFileRoute("/live/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ host: s.host === "1" ? "1" : undefined }),
  head: () => ({ meta: [{ title: "LIVE · Javan" }] }),
  component: LivePage,
});

interface GiftAnimationConfig {
  id: string;
  name: string;
  cost: number;
  color: string;
  emoji: string;
  animationType: "badge" | "overlay" | "screen-shake" | "epic-stampede" | "cosmic-roar";
}

const PREMIUM_GIFTS: Record<string, GiftAnimationConfig> = {
  javan_cap: { id: "javan_cap", name: "Javan Cap", cost: 10, color: "from-blue-500 to-indigo-600", emoji: "🧢", animationType: "badge" },
  bucket: { id: "bucket", name: "Bucket", cost: 50, color: "from-amber-400 to-orange-500", emoji: "🪣", animationType: "badge" },
  cub: { id: "cub", name: "Cub", cost: 500, color: "from-yellow-400 to-amber-600", emoji: "🦁", animationType: "overlay" },
  lioness: { id: "lioness", name: "Lioness", cost: 5000, color: "from-orange-500 to-red-600", emoji: "🐆", animationType: "overlay" },
  hisense_tv: { id: "hisense_tv", name: "Hisense Smart TV", cost: 25000, color: "from-cyan-400 to-blue-600", emoji: "📺", animationType: "screen-shake" },
  hippopotamus: { id: "hippopotamus", name: "Hippopotamus", cost: 100000, color: "from-purple-600 to-pink-700", emoji: "🦛", animationType: "screen-shake" },
  lion: { id: "lion", name: "Lion", cost: 1000005, color: "from-yellow-500 via-orange-600 to-red-700", emoji: "👑🦁", animationType: "cosmic-roar" },
  elephant: { id: "elephant", name: "Elephant", cost: 2000005, color: "from-emerald-500 via-teal-600 to-cyan-700", emoji: "🐘🌟", animationType: "epic-stampede" },
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

  // Module 4 & 6: Live Interaction States
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<GiftAnimationConfig | null>(null);
  const [hapticFeedbackTrigger, setHapticFeedbackTrigger] = useState<string | null>(null);
  const [trayStates, setTrayStates] = useState({
    flipped: false,
    beautify: false,
    effects: false,
    settings: false,
    service: false,
    fanclub: false,
    interact: false,
    shared: false,
    promoted: false
  });

  const { data: stream } = useQuery({
    queryKey: ["live-stream", id],
    queryFn: () => fetchStream(id),
    refetchInterval: 15_000,
  });

  const isHost = !!user && stream?.host_id === user.id;
  const wantHost = isHost && hostMode === "1";

  // Module 4: Listen to real-time gift notifications from backend triggers via Supabase Realtime System
  useEffect(() => {
    if (!id) return;
    const realtimeGiftChannel = supabase
      .channel(`live-gifts-listener-${id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "live_chat_messages",
        filter: `stream_id=eq.${id}`
      }, (payload: any) => {
        if (payload.new && payload.new.kind === "gift") {
          const matchedGift = PREMIUM_GIFTS[payload.new.gift_key];
          if (matchedGift) {
            setActiveGiftAnimation(matchedGift);
            setTimeout(() => setActiveGiftAnimation(null), 4500);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeGiftChannel);
    };
  }, [id]);

  // Presence for viewer count
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`live-presence-${id}`, {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setViewers(Object.keys(state).length);
      })
      .on("broadcast", { event: "heart" }, () => {
        setHearts((h) => [...h, Date.now() + Math.random()]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
          if (!isHost) postJoin(id, user.id).catch(() => {});
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [id, user?.id, isHost]);

  // Live camera capture
  useEffect(() => {
    if (!wantHost) return;
    let localStream: MediaStream | null = null;
    (async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHostStream(localStream);
      } catch (e: any) {
        toast.error(e?.message ?? "Camera permission denied");
      }
    })();
    return () => { localStream?.getTracks().forEach((t) => t.stop()); };
  }, [wantHost]);

  const enableViewerCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setHostStream(s);
      toast.success("Camera enabled");
    } catch (e: any) {
      toast.error(e?.message ?? "Camera permission denied");
    }
  };

  useEffect(() => {
    if (hostVideoRef.current && hostStream) hostVideoRef.current.srcObject = hostStream;
  }, [hostStream]);

  const sendHeart = () => {
    setHearts((h) => [...h, Date.now() + Math.random()]);
    supabase.channel(`live-presence-${id}`).send({ type: "broadcast", event: "heart", payload: {} });
    if (user) postHeart(id, user.id).catch(() => {});
  };

  const sendChat = async () => {
    if (!input.trim() || !user) return;
    const body = input.trim();
    setInput("");
    const { error } = await postChat(id, user.id, body);
    if (error) toast.error(error.message);
  };

  // Module 6: Setup Tray Click Trigger + Instant Simulated Haptic Feedback State Core
  const handleControlTrayAction = (key: keyof typeof trayStates) => {
    setHapticFeedbackTrigger(key);
    setTrayStates(prev => ({ ...prev, [key]: !prev[key] }));
    setTimeout(() => setHapticFeedbackTrigger(null), 120);
    toast.success(`Active control changed: ${key.toUpperCase()}`);
  };

  if (!stream) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black text-white/70 text-xs tracking-widest uppercase animate-pulse">Initializing Live Router Pipe…</div>
    );
  }

  if (stream.status === "ended") {
    return (
      <div className="mx-auto flex h-[100dvh] max-w-[480px] flex-col items-center justify-center bg-black px-8 text-center text-white">
        <div className="bg-gradient-primary mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-glow">
          <Radio className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold">This LIVE has ended</h1>
        <p className="mt-2 text-sm text-white/60">Thanks for tuning in. Explore who’s live right now.</p>
        <Link to="/" className="bg-gradient-primary mt-5 inline-flex items-center gap-1 rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
          <ArrowLeft className="h-3 w-3" /> Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-screen flex-col overflow-hidden bg-black text-white">
      
      {/* Module 4: High-Fidelity Gift Execution Graphic Engine overlay layers */}
      <AnimatePresence>
        {activeGiftAnimation && (
          <motion.div 
            className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black/40 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {activeGiftAnimation.animationType === "cosmic-roar" && (
              <motion.div 
                className="text-center"
                initial={{ scale: 0.1, rotate: -90 }}
                animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 4, ease: "easeInOut" }}
              >
                <div className="text-9xl drop-shadow-[0_0_60px_rgba(250,204,21,0.85)] animate-bounce">👑🦁</div>
                <h1 className="text-4xl font-black text-yellow-400 tracking-tighter uppercase drop-shadow-md mt-4">GOLDEN LION DESCENT</h1>
                <p className="text-white font-mono text-xs tracking-widest mt-1">1,000,005 COIN ESCROW RECORDED</p>
              </motion.div>
            )}

            {activeGiftAnimation.animationType === "epic-stampede" && (
              <motion.div 
                className="w-full text-center"
                initial={{ x: "-100%" }}
                animate={{ x: ["0%", "15%", "-15%", "0%"] }}
                transition={{ duration: 4.2, type: "spring", stiffness: 100 }}
              >
                <div className="text-9xl drop-shadow-[0_0_70px_rgba(16,185,129,0.9)]">🐘⚡️🌟</div>
                <h1 className="text-5xl font-black text-emerald-400 tracking-tight uppercase drop-shadow-lg mt-6">APEX ELEPHANT STAMPEDE</h1>
                <p className="text-cyan-300 font-mono text-xs tracking-wider mt-2">2,000,005 COIN MONETIZATION SETTLED</p>
              </motion.div>
            )}

            {activeGiftAnimation.animationType === "screen-shake" && (
              <motion.div 
                className="text-center"
                animate={{ x: [-12, 12, -12, 12, 0], y: [-12, 12, -12, 12, 0] }}
                transition={{ duration: 1.8 }}
              >
                <div className="text-7xl">{activeGiftAnimation.emoji}</div>
                <h2 className="text-2xl font-bold text-purple-400 uppercase mt-2">{activeGiftAnimation.name} Activated!</h2>
              </motion.div>
            )}

            {activeGiftAnimation.animationType === "overlay" && (
              <motion.div 
                className="text-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <div className="text-6xl animate-pulse">{activeGiftAnimation.emoji}</div>
                <div className="text-lg font-semibold text-white mt-1">{activeGiftAnimation.name} Arrived</div>
              </motion.div>
            )}

            {activeGiftAnimation.animationType === "badge" && (
              <motion.div 
                className="bg-white/10 px-4 py-2 rounded-full border border-white/20 flex items-center gap-2"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
              >
                <span className="text-2xl">{activeGiftAnimation.emoji}</span>
                <span className="text-white text-xs font-mono">{activeGiftAnimation.name} Dropped</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video area — full viewport */}
      <div className="absolute inset-0 h-full w-full">
        {wantHost && hostStream ? (
          <video ref={hostVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-900/40 via-black to-rose-900/30">
            <div className="text-center">
              {stream.host.avatar_url ? (
                <img src={stream.host.avatar_url} alt="" className="mx-auto h-32 w-32 rounded-full border-4 border-white/30 object-cover shadow-glow" />
              ) : (
                <div className="bg-gradient-primary mx-auto h-32 w-32 rounded-full border-4 border-white/30" />
              )}
              <div className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold">
                @{stream.host.handle}
                {stream.host.is_verified && <BadgeCheck className="h-4 w-4 text-accent" />}
              </div>
              <p className="mt-1 text-xs text-white/60">Waiting for host video…</p>
              {!isHost && (
                <button onClick={enableViewerCamera} className="glass mt-4 inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold active:scale-95">
                  <VideoIcon className="h-3.5 w-3.5" /> Enable my camera
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-4">
        <div className="glass-strong flex items-center gap-2 rounded-full py-1 pl-1 pr-3">
          <Link to="/u/$handle" params={{ handle: stream.host.handle }} aria-label={`@${stream.host.handle}`}>
            {stream.host.avatar_url ? (
              <img src={stream.host.avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/50 object-cover" />
            ) : (
              <div className="bg-gradient-primary h-8 w-8 rounded-full border border-white/50" />
            )}
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-xs font-semibold">
              @{stream.host.handle}
              {stream.host.is_verified && <BadgeCheck className="h-3 w-3 text-accent" />}
            </div>
            <div className="text-[10px] text-white/70">{stream.title || "LIVE now"}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold uppercase tracking-widest live-pulse">
            <Radio className="h-3 w-3" /> Live
          </span>
          <span className="glass flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold">
            <Users className="h-3 w-3" /> {Math.max(viewers, 1).toLocaleString()}
          </span>
          <button
            onClick={async () => {
              if (isHost) {
                await endStream(id);
                toast.success("LIVE ended");
              }
              navigate({ to: "/" });
            }}
            aria-label="Close"
            className="glass flex h-8 w-8 items-center justify-center rounded-full active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat + composer + Module 6 Studio Setup Overlay Layout Panel */}
      <div className="relative z-10 mx-auto mt-auto flex w-full max-w-[520px] flex-col gap-3 px-3 pb-6">
        
        {/* Module 6 Implementation: 2-Row Layout Control Matrix Element Tray */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-2 grid grid-cols-5 gap-1.5 shadow-xl">
          {(Object.keys(trayStates) as Array<keyof typeof trayStates>).map((key) => {
            const isActive = trayStates[key];
            const isHapticToggled = hapticFeedbackTrigger === key;
            
            return (
              <button
                key={key}
                onClick={() => handleControlTrayAction(key)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all duration-100 ${
                  isActive 
                    ? "bg-emerald-600/30 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)]" 
                    : "bg-black/50 border-white/5 text-neutral-400 hover:text-neutral-200"
                }`}
                style={{ transform: isHapticToggled ? "scale(0.9)" : "scale(1)" }}
              >
                {key === "flipped" && <RotateCw className="h-3.5 w-3.5" />}
                {key === "beautify" && <Wand2 className="h-3.5 w-3.5" />}
                {key === "effects" && <Sliders className="h-3.5 w-3.5" />}
                {key === "settings" && <Settings className="h-3.5 w-3.5" />}
                {key === "service" && <HeartHandshake className="h-3.5 w-3.5" />}
                {key === "fanclub" && <UserPlus className="h-3.5 w-3.5" />}
                {key === "interact" && <MessageSquare className="h-3.5 w-3.5" />}
                {key === "shared" && <Share2 className="h-3.5 w-3.5" />}
                {key === "promoted" && <TrendingUp className="h-3.5 w-3.5" />}
                <span className="text-[8px] font-black uppercase tracking-tight mt-1 truncate w-full text-center">{key}</span>
              </button>
            );
          })}
        </div>

        <LiveChat streamId={id} />

        <div className="flex items-center gap-2">
          <div className="glass-strong flex flex-1 items-center gap-2 rounded-full px-3 py-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder={user ? "Say something…" : "Sign in to chat"}
              disabled={!user}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/50"
            />
            <button onClick={sendChat} disabled={!input.trim() || !user} aria-label="Send" className="bg-gradient-primary flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground disabled:opacity-40">
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={() => (user ? setGiftOpen(true) : toast.info("Sign in to send gifts"))} aria-label="Send gift" className="glass-strong flex h-11 w-11 items-center justify-center rounded-full active:scale-90">
            <GiftIcon className="h-5 w-5 text-amber-300" />
          </button>
          <button onClick={sendHeart} aria-label="Send heart" className="glass-strong flex h-11 w-11 items-center justify-center rounded-full active:scale-90">
            <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
          </button>
        </div>

        {wantHost && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-white/60">
            <VideoIcon className="h-3 w-3" /> You’re hosting this LIVE
          </div>
        )}
      </div>

      {/* Floating hearts */}
      <div className="pointer-events-none absolute bottom-24 right-4 z-20 h-72 w-16">
        <AnimatePresence>
          {hearts.slice(-20).map((h) => (
            <motion.div
              key={h}
              initial={{ y: 0, opacity: 1, x: 0, scale: 0.6 }}
              animate={{ y: -260, opacity: 0, x: (Math.random() - 0.5) * 60, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              onAnimationComplete={() => setHearts((prev) => prev.filter((x) => x !== h))}
              className="absolute bottom-0 right-0 text-2xl"
            >
              ❤️
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <GiftPanel
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        recipientId={stream.host_id}
        onSend={async (g) => {
          if (!user) return;
          await supabase.from("live_chat_messages").insert({
            stream_id: id, user_id: user.id, kind: "gift",
            body: g.name, gift_key: g.id, gift_coins: g.cost,
          });
        }}
      />
    </div>
  );
}
