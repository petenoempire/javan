import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Gift as GiftIcon, Heart, Send, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { liveStreams, liveChatSeed, type Gift } from "@/lib/mock";
import { GiftPanel } from "@/components/GiftPanel";

export const Route = createFileRoute("/live/$id")({
  component: Live,
});

type ChatLine = { id: number; user: string; msg: string; color: string };
type FloatingGift = { id: number; icon: string; user: string };

function Live() {
  const { id } = Route.useParams();
  const stream = liveStreams.find((s) => s.id === id) ?? liveStreams[0];
  const [chat, setChat] = useState<ChatLine[]>(liveChatSeed.map((c, i) => ({ ...c, id: i })));
  const [text, setText] = useState("");
  const [giftOpen, setGiftOpen] = useState(false);
  const [floats, setFloats] = useState<FloatingGift[]>([]);
  const [toasts, setToasts] = useState<{ id: number; user: string; gift: Gift }[]>([]);
  const [viewers, setViewers] = useState(stream.viewers);
  const chatEnd = useRef<HTMLDivElement>(null);

  // simulate live chat + viewer count
  useEffect(() => {
    const i1 = setInterval(() => {
      const s = liveChatSeed[Math.floor(Math.random() * liveChatSeed.length)];
      setChat((p) => [...p.slice(-30), { ...s, id: Date.now() }]);
    }, 2200);
    const i2 = setInterval(() => setViewers((v) => v + Math.floor(Math.random() * 12) - 4), 3000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [chat]);

  const sendChat = () => {
    if (!text.trim()) return;
    setChat((p) => [...p, { id: Date.now(), user: "you", msg: text, color: "var(--primary)" }]);
    setText("");
  };

  const handleGift = (g: Gift) => {
    const fid = Date.now();
    setFloats((p) => [...p, { id: fid, icon: g.icon, user: "you" }]);
    setToasts((p) => [...p, { id: fid, user: "you", gift: g }]);
    setTimeout(() => setFloats((p) => p.filter((x) => x.id !== fid)), 1700);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== fid)), 3000);
  };

  return (
    <div className="relative mx-auto h-[100dvh] max-w-[480px] overflow-hidden bg-black">
      {/* video bg (looping cover) */}
      <img src={stream.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* top bar */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Link to="/discover" className="glass rounded-full p-2"><ArrowLeft className="h-5 w-5 text-white" /></Link>
          <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5">
            <img src={stream.host.avatar} className="h-7 w-7 rounded-full" alt="" />
            <div className="text-white">
              <div className="text-xs font-semibold leading-tight">@{stream.host.handle}</div>
              <div className="text-[10px] opacity-80">{stream.category}</div>
            </div>
            <button className="bg-gradient-primary ml-2 rounded-full px-3 py-1 text-[10px] font-bold text-primary-foreground">Follow</button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-gradient-live live-pulse rounded-full px-2.5 py-1 text-[10px] font-bold text-white">● LIVE</div>
          <div className="glass flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white">
            <Users className="h-3 w-3" /> {viewers.toLocaleString()}
          </div>
        </div>
      </header>

      {/* floating gifts */}
      <div className="pointer-events-none absolute bottom-32 left-6 z-30">
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div
              key={f.id}
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{ y: -200, opacity: [0, 1, 1, 0], scale: 1.6, x: Math.random() * 60 - 30 }}
              transition={{ duration: 1.6 }}
              className="absolute text-5xl"
            >
              {f.icon}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* gift toasts */}
      <div className="absolute left-4 top-24 z-30 space-y-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -200, opacity: 0 }}
              className="bg-gradient-gold flex items-center gap-2 rounded-full px-3 py-1.5 shadow-glow"
            >
              <span className="text-xl">{t.gift.icon}</span>
              <div className="text-xs font-semibold text-background">
                @{t.user} sent {t.gift.name}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* chat */}
      <div className="absolute bottom-24 left-4 right-20 z-20 max-h-[40dvh] space-y-1.5 overflow-y-auto no-scrollbar">
        {chat.map((c) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass inline-block max-w-full rounded-full px-3 py-1"
          >
            <span className="text-xs font-bold" style={{ color: c.color }}>@{c.user}</span>
            <span className="ml-2 text-xs text-white">{c.msg}</span>
          </motion.div>
        )).reverse().reverse()}
        <div ref={chatEnd} />
      </div>

      {/* input bar */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2">
        <div className="glass-strong flex flex-1 items-center gap-2 rounded-full px-4 py-2.5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Say something nice…"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60"
          />
          <button onClick={sendChat} className="text-white"><Send className="h-4 w-4" /></button>
        </div>
        <button onClick={() => setGiftOpen(true)} className="bg-gradient-gold flex h-11 w-11 items-center justify-center rounded-full shadow-glow active:scale-90">
          <GiftIcon className="h-5 w-5 text-background" />
        </button>
        <button className="glass-strong flex h-11 w-11 items-center justify-center rounded-full active:scale-90">
          <Heart className="h-5 w-5 text-rose" />
        </button>
      </div>

      <GiftPanel open={giftOpen} onClose={() => setGiftOpen(false)} onSend={handleGift} />
    </div>
  );
}
