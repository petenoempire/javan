import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Heart, Send, Gift as GiftIcon, Users, BadgeCheck, X, Radio, Video as VideoIcon } from "lucide-react";
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

  const { data: stream } = useQuery({
    queryKey: ["live-stream", id],
    queryFn: () => fetchStream(id),
    refetchInterval: 15_000,
  });

  const isHost = !!user && stream?.host_id === user.id;
  const wantHost = isHost && hostMode === "1";

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

  // Host camera capture
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

  if (!stream) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-black text-white/70">Loading LIVE…</div>
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

      {/* Chat + composer */}
      <div className="relative z-10 mt-auto flex flex-col gap-3 px-3 pb-6">
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
