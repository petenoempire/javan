import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, RotateCw, Radio, Users, Shield, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { ModeCarousel } from "./ModeCarousel";
import type { StudioMode } from "@/lib/studio/types";

export function LiveSuite({
  mode,
  onMode,
  onClose,
}: {
  mode: StudioMode;
  onMode: (m: StudioMode) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [title, setTitle] = useState("");
  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: true });
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera access is required to go LIVE.");
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  const goLive = async () => {
    if (!user) {
      toast.error("Sign in to start a LIVE");
      return;
    }
    setGoing(true);
    const { data, error: err } = await supabase
      .from("live_streams")
      .insert({ host_id: user.id, title: title.trim() || "Live now", status: "live" })
      .select("id")
      .single();
    setGoing(false);
    if (err || !data) {
      toast.error(err?.message ?? "Couldn't start your stream");
      return;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate({ to: "/live/$id", params: { id: data.id }, search: { host: "1" } });
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="absolute inset-0">
        {error ? (
          <div className="flex h-full items-center justify-center px-10 text-center text-sm text-white/60">{error}</div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/80" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-5">
        <button onClick={onClose} aria-label="Close live setup" className="rounded-full bg-black/45 p-2.5 active:scale-90">
          <X className="h-5 w-5" />
        </button>
        <span className="rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-3 py-1 text-[11px] font-black text-black">
          Javan LIVE Rewards
        </span>
        <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} aria-label="Flip camera" className="rounded-full bg-black/45 p-2.5 active:scale-90">
          <RotateCw className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-10 mt-auto space-y-4 px-4 pb-6">
        <div className="rounded-3xl bg-black/55 p-4 backdrop-blur">
          <label htmlFor="live-title" className="text-[11px] font-black uppercase tracking-widest text-white/50">
            Stream title
          </label>
          <input
            id="live-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="What's happening?"
            className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold">
            {[
              { icon: Users, label: "Guests" },
              { icon: Shield, label: "Moderation" },
              { icon: Sparkles, label: "Effects" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => toast.info(`${label} controls open once your LIVE starts`)}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-3 active:scale-95"
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <button
            onClick={goLive}
            disabled={going || !!error}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 py-3.5 text-sm font-black disabled:opacity-50 active:scale-95"
          >
            {going ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />} Go LIVE
          </button>
        </div>
        <ModeCarousel value={mode} onChange={onMode} />
      </div>
    </div>
  );
}
