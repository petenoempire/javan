import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X, Loader2, Music2, Image as ImageIcon, Sparkles, Scissors, Type,
  Sticker, Crop, SlidersHorizontal, Plus, ChevronRight, ChevronDown, MapPin, Lock,
  Tag, AtSign, Link2, Eye, Share2, ArrowUp, RotateCcw, Wand2, Settings,
  Heart, UserPlus2, FileText, Camera, Video as VideoIcon, Mic2, Gamepad2,
  Shield, Gift, Timer, Grid3x3, Zap, Users, Megaphone, MessageCircle, Radio, Target,
} from "lucide-react";

type Mode = "LIVE" | "POST" | "CREATE";
type Step = 1 | 2 | 3;

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Studio · Javan" }] }),
  component: CreateStudio,
});

function CreateStudio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>("POST");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(true);
  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState("Everyone");
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-8 text-center">
        <h2 className="font-display text-xl font-bold">Sign in to create</h2>
        <Link to="/auth" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Sign in</Link>
      </div>
    );
  }

  const pick = (acceptVideo = true) => {
    if (fileInput.current) {
      fileInput.current.accept = acceptVideo ? "video/*,image/*" : "image/*";
      fileInput.current.click();
    }
  };

  const onPick = (f: File) => {
    if (f.size > 200 * 1024 * 1024) { toast.error("Max 200MB"); return; }
    setFile(f);
    setIsVideo(f.type.startsWith("video/"));
    setPreviewUrl(URL.createObjectURL(f));
    setStep(2);
  };

  const publish = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
      const fullCaption = [title, caption, description, location && `📍 ${location}`].filter(Boolean).join("\n");
      const tags = Array.from(fullCaption.matchAll(/#([\p{L}0-9_]+)/gu)).map((m) => m[1].toLowerCase());
      const { error: insErr } = await supabase.from("videos").insert({
        user_id: user.id, video_url: pub.publicUrl, caption: fullCaption, music: music || null, tags,
      });
      if (insErr) throw insErr;
      toast.success("Posted to Javan");
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white">
      <input ref={fileInput} type="file" hidden onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />

      <button
        onClick={() => (step === 1 ? navigate({ to: "/" }) : setStep((step - 1) as Step))}
        className="glass absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {step === 1 && <StepSelector mode={mode} setMode={setMode} onPickFile={pick} onCaptured={onPick} />}
      {step === 2 && previewUrl && (
        <StepEditor
          previewUrl={previewUrl} isVideo={isVideo}
          caption={caption} setCaption={setCaption}
          music={music} setMusic={setMusic}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && previewUrl && (
        <StepPublish
          previewUrl={previewUrl} isVideo={isVideo}
          title={title} setTitle={setTitle}
          description={description} setDescription={setDescription}
          location={location} setLocation={setLocation}
          audience={audience} setAudience={setAudience}
          uploading={uploading} onPublish={publish}
        />
      )}
    </div>
  );
}

// ─── STEP 1 ───────────────────────────────────────────────────────────────

function StepSelector({ mode, setMode, onPickFile, onCaptured }: { mode: Mode; setMode: (m: Mode) => void; onPickFile: (v?: boolean) => void; onCaptured: (f: File) => void }) {
  return (
    <div className="relative h-full overflow-hidden">
      {mode === "LIVE" && <LivePanel onCaptured={onCaptured} />}
      {mode === "POST" && <PostPanel onPickFile={() => onPickFile(true)} onCaptured={onCaptured} />}
      {mode === "CREATE" && <CreatePanel onPickFile={() => onPickFile(true)} />}

      <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pb-6 pt-10">
        <div className="mx-auto flex w-fit gap-7 rounded-full bg-white/10 px-6 py-3 backdrop-blur">
          {(["LIVE", "POST", "CREATE"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`text-sm font-bold tracking-widest transition ${mode === m ? "text-white" : "text-white/40"}`}>
              {m}
              {mode === m && <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const liveSwitches = [
  { label: "Voice chat", icon: Mic2 },
  { label: "Device camera", icon: Camera },
  { label: "Mobile gaming", icon: Gamepad2 },
];

type SideAction = { key: string; icon: typeof Camera; label: string };
type TrayAction = { key: string; icon: typeof Camera; label: string };

function LivePanel({ onCaptured }: { onCaptured: (f: File) => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sub, setSub] = useState("Device camera");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [starting, setStarting] = useState(false);
  const [title, setTitle] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [rewards, setRewards] = useState(true);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [beauty, setBeauty] = useState(35);
  const [speed, setSpeed] = useState(1);
  const [countdown, setCountdown] = useState(0);
  const [gridOn, setGridOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  void onCaptured;

  const startCamera = async (mode: "user" | "environment" = facing) => {
    try {
      stream?.getTracks().forEach((t) => t.stop());
      const capture = sub === "Voice chat"
        ? await navigator.mediaDevices.getUserMedia({ audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: true });
      setStream(capture);
    } catch (e: any) {
      toast.error(e?.message ?? "Camera permission was not granted");
    }
  };

  useEffect(() => {
    startCamera(facing);
    return () => stream?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  const flipCamera = () => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    startCamera(next);
    toast.success(`Flipped to ${next === "user" ? "front" : "rear"} camera`);
  };

  const openDrawer = (key: string) => setActiveDrawer((d) => (d === key ? null : key));

  const sideActions: SideAction[] = [
    { key: "flip", icon: RotateCcw, label: "Flip" },
    { key: "speed", icon: Zap, label: "Speed" },
    { key: "timer", icon: Timer, label: "Timer" },
    { key: "grid", icon: Grid3x3, label: "Grid" },
    { key: "beautify", icon: Wand2, label: "Beautify" },
    { key: "effects", icon: Sparkles, label: "Effects" },
  ];

  const tray: TrayAction[] = [
    { key: "flip", icon: RotateCcw, label: "Flip" },
    { key: "beautify", icon: Wand2, label: "Beautify" },
    { key: "effects", icon: Sparkles, label: "Effects" },
    { key: "settings", icon: Settings, label: "Settings" },
    { key: "moderation", icon: Shield, label: "Moderation" },
    { key: "fanclub", icon: Users, label: "Fan Club" },
    { key: "interact", icon: MessageCircle, label: "Interact" },
    { key: "share", icon: Share2, label: "Share" },
    { key: "promote", icon: Megaphone, label: "Promote" },
  ];

  const runSide = (key: string) => {
    if (key === "flip") return flipCamera();
    if (key === "grid") { setGridOn((g) => !g); toast.info(`Grid ${!gridOn ? "on" : "off"}`); return; }
    openDrawer(key);
  };

  const runTray = (key: string) => {
    if (key === "flip") return flipCamera();
    if (key === "share") { navigator.clipboard?.writeText("https://javan.app/live").catch(() => {}); toast.success("Invite link copied"); return; }
    if (key === "settings") { toast.info("LIVE settings opened"); return; }
    openDrawer(key);
  };

  const goLive = async () => {
    if (!user) { toast.error("Sign in to go LIVE"); return; }
    setStarting(true);
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .insert({ host_id: user.id, title: title.trim() || sub })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("Could not start LIVE");
      stream?.getTracks().forEach((t) => t.stop());
      navigate({ to: "/live/$id", params: { id: data.id }, search: { host: "1" } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not start LIVE");
    } finally {
      setStarting(false);
    }
  };

  const isVoice = sub === "Voice chat";

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-black text-white">
      {/* Camera / audio background */}
      {isVoice ? (
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/60 via-black to-rose-900/40" />
      ) : stream ? (
        <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <button onClick={() => startCamera(facing)} className="rounded-full bg-white/10 px-5 py-2 text-xs font-semibold backdrop-blur active:scale-95">
            Tap to enable camera
          </button>
        </div>
      )}

      {/* Grid overlay */}
      {gridOn && !isVoice && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/25" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/25" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/25" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/25" />
        </div>
      )}

      {/* Vignette for text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />

      {/* Top header — the parent's X button sits at top-left already */}
      <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-end gap-2 pl-16 pr-3">
        <button
          onClick={() => { setRewards((r) => !r); toast.success(rewards ? "LIVE Rewards paused" : "LIVE Rewards enabled"); }}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-lg backdrop-blur active:scale-95 ${rewards ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black" : "bg-black/50 text-white/80"}`}
        >
          <Gift className="h-3.5 w-3.5" /> Javan LIVE Rewards
        </button>
        <button onClick={() => openDrawer("moderation")} aria-label="Moderation" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur active:scale-90">
          <Shield className="h-4 w-4" />
        </button>
        <button onClick={() => openDrawer("hub")} aria-label="LIVE Center" className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur active:scale-90">
          <Target className="h-4 w-4" />
        </button>
      </div>

      {/* Right sidebar */}
      <div className="absolute right-3 top-20 z-20 flex flex-col items-center gap-4">
        {sideActions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => runSide(key)}
            aria-label={label}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white drop-shadow active:scale-90"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur">
              <Icon className="h-5 w-5" />
            </span>
            <span>{label}</span>
          </button>
        ))}
        <button onClick={() => setExpanded((v) => !v)} aria-label="Expand" className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 backdrop-blur active:scale-90">
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <>
            <button onClick={() => openDrawer("music")} aria-label="Sound" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold active:scale-90">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur"><Music2 className="h-5 w-5" /></span>
              <span>Sound</span>
            </button>
            <button onClick={() => openDrawer("privacy")} aria-label="Privacy" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold active:scale-90">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur"><Lock className="h-5 w-5" /></span>
              <span>Privacy</span>
            </button>
          </>
        )}
      </div>

      {/* Lower setup card */}
      <div className="absolute inset-x-0 bottom-32 z-20 px-3">
        <div className="mx-auto max-w-[460px] rounded-3xl bg-black/55 p-3 shadow-elegant backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-2">
            {tray.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => runTray(key)}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/5 px-1 py-2 text-[10px] font-semibold text-white transition active:scale-90 active:opacity-70"
              >
                <Icon className="h-5 w-5" />
                <span className="leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/5 px-2 py-2">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="bg-gradient-primary h-8 w-8 rounded-full" />
            )}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title..."
              maxLength={80}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/50"
            />
            <button onClick={() => openDrawer("goal")} className="whitespace-nowrap text-[11px] font-bold text-amber-300 active:scale-95">
              | Set Stream Goal
            </button>
          </div>

          <button
            onClick={goLive}
            disabled={starting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-[0_10px_40px_-10px_rgba(244,63,94,0.9)] transition active:scale-[0.98] active:opacity-90 disabled:opacity-60"
          >
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
            {starting ? "Starting…" : "Go LIVE"}
          </button>
        </div>
      </div>

      {/* Stream mode selector (horizontal scroll) */}
      <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center px-3">
        <div className="no-scrollbar flex max-w-full items-center gap-2 overflow-x-auto rounded-full bg-black/45 px-2 py-1.5 backdrop-blur">
          {liveSwitches.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setSub(label)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                sub === label ? "bg-white text-black" : "text-white/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Drawers */}
      {activeDrawer && (
        <div className="absolute inset-0 z-30 flex items-end" onClick={() => setActiveDrawer(null)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto w-full max-w-[520px] rounded-t-3xl bg-neutral-950/95 p-5 pb-8 text-white shadow-elegant backdrop-blur-xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/25" />
            <DrawerBody
              which={activeDrawer}
              beauty={beauty} setBeauty={setBeauty}
              speed={speed} setSpeed={setSpeed}
              countdown={countdown} setCountdown={setCountdown}
            />
            <button onClick={() => setActiveDrawer(null)} className="mt-5 w-full rounded-full bg-white/10 py-2.5 text-sm font-semibold active:scale-95">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DrawerBody({
  which, beauty, setBeauty, speed, setSpeed, countdown, setCountdown,
}: {
  which: string;
  beauty: number; setBeauty: (n: number) => void;
  speed: number; setSpeed: (n: number) => void;
  countdown: number; setCountdown: (n: number) => void;
}) {
  if (which === "beautify") {
    return (
      <div>
        <h3 className="mb-2 text-sm font-bold">Beautify</h3>
        <p className="mb-3 text-xs text-white/60">Smoothing intensity: {beauty}</p>
        <input type="range" min={0} max={100} value={beauty} onChange={(e) => setBeauty(Number(e.target.value))} className="w-full accent-rose-500" />
      </div>
    );
  }
  if (which === "speed") {
    return (
      <div>
        <h3 className="mb-3 text-sm font-bold">Capture speed</h3>
        <div className="flex gap-2">
          {[0.5, 1, 1.5, 2, 3].map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className={`flex-1 rounded-full py-2 text-xs font-bold active:scale-95 ${speed === s ? "bg-white text-black" : "bg-white/10"}`}>{s}x</button>
          ))}
        </div>
      </div>
    );
  }
  if (which === "timer") {
    return (
      <div>
        <h3 className="mb-3 text-sm font-bold">Countdown</h3>
        <div className="flex gap-2">
          {[0, 3, 5, 10].map((n) => (
            <button key={n} onClick={() => setCountdown(n)} className={`flex-1 rounded-full py-2 text-xs font-bold active:scale-95 ${countdown === n ? "bg-white text-black" : "bg-white/10"}`}>{n === 0 ? "Off" : `${n}s`}</button>
          ))}
        </div>
      </div>
    );
  }
  if (which === "effects") {
    return (
      <div>
        <h3 className="mb-3 text-sm font-bold">Effects</h3>
        <div className="grid grid-cols-4 gap-3">
          {["Sparkle", "Neon", "Glow", "Retro", "Blur", "Sepia", "B&W", "Warm"].map((e) => (
            <button key={e} onClick={() => toast.success(`${e} applied`)} className="aspect-square rounded-2xl bg-white/10 text-[10px] font-bold active:scale-95">{e}</button>
          ))}
        </div>
      </div>
    );
  }
  if (which === "moderation") {
    return (
      <div>
        <h3 className="mb-3 text-sm font-bold">Moderation</h3>
        {["Keyword filter", "Comment approval", "Add moderator", "Block viewer"].map((r) => (
          <button key={r} onClick={() => toast.info(`${r} opened`)} className="mb-2 flex w-full items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold active:scale-[0.99]">
            <span>{r}</span><ChevronRight className="h-4 w-4 text-white/50" />
          </button>
        ))}
      </div>
    );
  }
  if (which === "goal") {
    return (
      <div>
        <h3 className="mb-2 text-sm font-bold">Stream goal</h3>
        <p className="mb-3 text-xs text-white/60">Set a coin goal viewers can help you hit.</p>
        <div className="flex gap-2">
          {[500, 1000, 5000, 10000].map((v) => (
            <button key={v} onClick={() => toast.success(`Goal set to ${v.toLocaleString()} coins`)} className="flex-1 rounded-full bg-white/10 py-2 text-xs font-bold active:scale-95">{v.toLocaleString()}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold capitalize">{which}</h3>
      <p className="text-xs text-white/60">This panel is ready. More controls coming soon.</p>
    </div>
  );
}

const CrownIcon = Sparkles;
const postTimers = ["10m", "60s", "15s", "PHOTO", "TEXT"];

function PostPanel({ onPickFile, onCaptured }: { onPickFile: () => void; onCaptured: (f: File) => void }) {
  const [timer, setTimer] = useState("15s");
  const [textPost, setTextPost] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tools = [
    [RotateCcw, "Flip"], [Wand2, "Beautify"], [Settings, "Timer"], [LayoutMiniIcon, "Grid"], [UserPlus2, "Add friends"], [SlidersHorizontal, "Filters"],
  ] as const;
  const isText = timer === "TEXT";
  const isPhoto = timer === "PHOTO";
  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
    return () => cameraStream?.getTracks().forEach((t) => t.stop());
  }, [cameraStream]);
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isPhoto });
      setCameraStream(stream);
      toast.success("Camera ready");
    } catch (e: any) {
      toast.error(e?.message ?? "Camera permission was not granted");
    }
  };
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return openCamera();
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 720;
    c.height = v.videoHeight || 1280;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => blob && onCaptured(new File([blob], `javan-photo-${Date.now()}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.92);
  };
  const captureTextPost = () => {
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1920;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#f8fafc"); gradient.addColorStop(1, "#f472b6");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "#111827"; ctx.font = "700 72px sans-serif"; ctx.textAlign = "center";
    wrapCanvasText(ctx, textPost || "Javan text post", 540, 900, 880, 88);
    c.toBlob((blob) => blob && onCaptured(new File([blob], `javan-text-${Date.now()}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.92);
  };
  return (
    <div className={`relative h-full ${isText ? "bg-neutral-100 text-black" : "creation-camera-bg"}`}>
      <button onClick={() => toast.info("Pick or type a sound name on the next screen")} className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 px-4 py-2 text-xs font-bold text-white backdrop-blur">
        <Music2 className="h-4 w-4" /> Add sound
      </button>

      {!isText && (
        <>
        {cameraStream && <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute right-3 top-24 z-10 flex flex-col gap-4 text-white">
          {tools.map(([Icon, label]) => (
            <button key={label} onClick={() => toast.info(`${label} applied`)} aria-label={label} className="flex flex-col items-center gap-1 text-[10px] font-semibold active:scale-90">
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        </>
      )}

      {isText ? (
        <div className="flex h-full flex-col justify-end pb-32">
          <div className="mx-5 mb-8 rounded-3xl bg-white px-5 py-20 text-center shadow-elegant">
            <textarea value={textPost} onChange={(e) => setTextPost(e.target.value)} autoFocus placeholder="Share your thoughts or questions to spark discussions" className="min-h-32 w-full resize-none bg-transparent text-center text-2xl font-semibold leading-snug text-black outline-none placeholder:text-neutral-400" />
          </div>
          <button onClick={captureTextPost} className="mx-auto mb-4 rounded-full bg-rose-500 px-10 py-3 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(244,63,94,0.8)]">Next</button>
          <div className="h-44 rounded-t-3xl bg-neutral-300/90" />
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-5">
          <div className="flex items-end gap-7">
            <button onClick={onPickFile} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 text-white backdrop-blur">
              <ImageIcon className="h-6 w-6" />
            </button>
            <button onClick={isPhoto ? capturePhoto : openCamera} aria-label="Capture" className="relative h-24 w-24 rounded-full border-4 border-white active:scale-95">
              <div className={`absolute inset-2 rounded-full ${isPhoto ? "bg-white" : "bg-rose-500"}`} />
            </button>
            <button onClick={openCamera} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40 text-white backdrop-blur" aria-label="Flip camera">
              <RotateCcw className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-52 z-10 flex justify-center gap-5 text-xs text-white">
        {postTimers.map((t) => (
          <button key={t} onClick={() => setTimer(t)} className={`font-bold ${timer === t ? "text-rose-400" : isText ? "text-black/50" : "text-white/55"}`}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function LayoutMiniIcon({ className }: { className?: string }) {
  return <SlidersHorizontal className={className} />;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });
  if (line) ctx.fillText(line, x, currentY);
}

const createTiles = [
  { label: "Photo editor", icon: ImageIcon },
  { label: "AutoCut", icon: Scissors },
  { label: "Captions", icon: Type },
  { label: "AI Self", icon: Sparkles },
  { label: "Cutout", icon: Crop },
];
const templates = ["For You", "Viral Song", "Sports ⚽", "Trendy"];

function CreatePanel({ onPickFile }: { onPickFile: () => void }) {
  const [tab, setTab] = useState("For You");
  return (
    <div className="h-full overflow-y-auto bg-black px-5 pb-36 pt-20 text-white">
      <div className="grid grid-cols-5 gap-2">
        {createTiles.map((t) => (
          <button key={t.label} onClick={onPickFile} className="flex flex-col items-center gap-2 rounded-2xl bg-white/10 px-1 py-3 active:scale-95">
            <t.icon className="h-6 w-6" />
            <span className="text-center text-[9px] font-semibold leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[1fr_110px] gap-3">
        <button onClick={onPickFile} className="flex items-center justify-between rounded-3xl bg-white px-5 py-6 text-black shadow-elegant active:scale-[0.98]">
          <div className="text-left">
            <div className="font-display text-xl font-bold">New video</div>
            <div className="text-xs text-black/55">Record or upload</div>
          </div>
          <Plus className="h-8 w-8" />
        </button>
        <button onClick={() => toast.info("No drafts yet")} className="rounded-3xl bg-white/10 px-4 py-5 text-left active:scale-[0.98]">
          <FileText className="h-7 w-7" />
          <div className="mt-5 font-display text-lg font-bold">1</div>
          <div className="text-xs text-white/60">Drafts</div>
        </button>
      </div>

      <section className="mt-7">
        <h2 className="font-display text-xl font-bold">Templates</h2>
        <div className="no-scrollbar mt-3 flex gap-5 overflow-x-auto text-sm">
          {templates.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap font-bold ${tab === t ? "text-white" : "text-white/40"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["World tour", "Birthday flash", "Glow reveal", "Street edit"].map((name, i) => (
            <button key={name} onClick={onPickFile} className={`relative aspect-[9/14] overflow-hidden rounded-3xl p-3 text-left shadow-elegant active:scale-[0.98] ${["creation-template-world", "creation-template-couple", "creation-template-clock", "creation-template-neon"][i]}`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/10" />
              <div className="relative mt-auto flex h-full flex-col justify-end">
                <div className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold backdrop-blur">{tab}</div>
                <div className="mt-2 font-display text-sm font-bold">{name}</div>
                <div className="text-[10px] text-white/65">Tap to remix</div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── STEP 2 ───────────────────────────────────────────────────────────────

function StepEditor({
  previewUrl, isVideo, caption, setCaption, music, setMusic, onNext,
}: {
  previewUrl: string; isVideo: boolean;
  caption: string; setCaption: (s: string) => void;
  music: string; setMusic: (s: string) => void;
  onNext: () => void;
}) {
  const tools = [
    { icon: SlidersHorizontal, label: "Filters" },
    { icon: Crop, label: "Crop" },
    { icon: Sticker, label: "Stickers" },
    { icon: Music2, label: "Audio" },
    { icon: Type, label: "Aa" },
    { icon: Sparkles, label: "FX" },
  ];

  return (
    <div className="relative h-full">
      {isVideo ? (
        <video src={previewUrl} className="h-full w-full object-cover" autoPlay loop muted playsInline />
      ) : (
        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* Right sidebar tools */}
      <div className="absolute right-3 top-20 flex flex-col gap-3">
        {tools.map((t) => (
          <button key={t.label} onClick={() => toast.info(`${t.label} editor opened`)} className="glass flex h-11 w-11 flex-col items-center justify-center rounded-full text-[9px]" aria-label={t.label}>
            <t.icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Caption + sound */}
      <div className="absolute inset-x-0 bottom-24 space-y-3 px-4">
        <textarea
          value={caption} onChange={(e) => setCaption(e.target.value)} rows={2}
          placeholder="What's the story? Use #tags"
          className="glass w-full resize-none rounded-2xl border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/60"
        />
        <div className="glass flex items-center gap-2 rounded-2xl border-white/20 bg-black/40 px-4 py-3">
          <Music2 className="h-4 w-4" />
          <input value={music} onChange={(e) => setMusic(e.target.value)} placeholder="Original sound" className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/60" />
        </div>
      </div>

      {/* Footer actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-5 pb-6">
        <button onClick={() => toast.success("Ready to share as your Story")} className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold">
          <div className="h-6 w-6 rounded-full bg-white/30" />
          Your Story
        </button>
        <button onClick={onNext} className="flex items-center gap-1 rounded-full bg-rose-500 px-7 py-3 text-sm font-bold shadow-[0_0_30px_-8px_rgba(244,63,94,0.8)]">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3 ───────────────────────────────────────────────────────────────

const locationChips = ["Bayelsa State Heritage", "Ox-Bow Lake", "Lagos", "Add location"];

function StepPublish({
  previewUrl, isVideo, title, setTitle, description, setDescription,
  location, setLocation, audience, setAudience, uploading, onPublish,
}: any) {
  const rows = [
    { icon: MapPin, label: "Location", value: location || "Add location", onClick: () => setLocation(location || "Add location") },
    { icon: Eye, label: "Content disclosure & ads", value: "Off", onClick: () => toast.info("Content disclosure settings opened") },
    { icon: Link2, label: "Add link", onClick: () => toast.info("Paste a link in your description for now") },
    { icon: Lock, label: "Audience", value: `${audience} can view this post`, onClick: () => setAudience(audience === "Everyone" ? "Followers" : "Everyone") },
    { icon: Share2, label: "Share to other apps", onClick: () => toast.success("Sharing will be available after posting") },
    { icon: Settings, label: "More options", onClick: () => toast.info("Advanced post options opened") },
  ];

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white">
      <header className="flex items-center gap-3 border-b border-white/10 px-4 py-4 pt-16">
        <h2 className="font-display text-lg font-bold">Post</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {/* Cover + add more */}
        <div className="mb-4 flex gap-3">
          <div className="relative h-28 w-20 overflow-hidden rounded-xl bg-black">
            {isVideo ? (
              <video src={previewUrl} className="h-full w-full object-cover" muted />
            ) : (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold">Cover</div>
          </div>
          <button onClick={() => toast.info("Add another clip from the first screen")} className="flex h-28 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-[10px] text-white/60">
            <Plus className="h-5 w-5" />
            Add more
          </button>
        </div>

        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a catchy title"
          className="w-full border-b border-white/10 bg-transparent py-3 text-base font-semibold outline-none placeholder:text-white/40"
        />
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Describe your post..."
          className="w-full resize-none border-b border-white/10 bg-transparent py-3 text-sm outline-none placeholder:text-white/40"
        />

        <div className="flex gap-2 border-b border-white/10 py-3 text-xs text-white/70">
          <button onClick={() => setDescription(`${description} #javan`.trim())} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5"><Tag className="h-3 w-3" /># Hashtag</button>
          <button onClick={() => setDescription(`${description} @`.trim())} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5"><AtSign className="h-3 w-3" /> Mention</button>
          <button onClick={() => setDescription(description || "Behind the scenes, real moments, and fresh energy for the Javan community.")} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5"><Sparkles className="h-3 w-3" /> Description ideas</button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {locationChips.map((c) => (
            <button key={c} onClick={() => setLocation(c === "Add location" ? "" : c)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] ${location === c ? "bg-rose-500" : "bg-white/5"}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="mt-5 divide-y divide-white/5 rounded-2xl bg-white/5">
          {rows.map((r) => (
            <button key={r.label} onClick={r.onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <r.icon className="h-4 w-4 text-white/60" />
              <span className="flex-1 text-sm">{r.label}</span>
              {r.value && <span className="text-xs text-white/50">{r.value}</span>}
              <ChevronRight className="h-4 w-4 text-white/40" />
            </button>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[480px] gap-3 border-t border-white/10 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <button onClick={() => toast.success("Draft saved on this device until you publish")} className="flex-1 rounded-full border border-white/20 py-3 text-sm font-bold">Drafts</button>
        <button
          onClick={onPublish} disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 py-3 text-sm font-bold shadow-[0_0_30px_-8px_rgba(244,63,94,0.8)] disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          {uploading ? "Posting" : "Post"}
        </button>
      </div>
    </div>
  );
}
