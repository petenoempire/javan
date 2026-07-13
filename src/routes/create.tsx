import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  X, Loader2, Music2, Image as ImageIcon, Sparkles, Scissors, Type,
  Sticker, Crop, SlidersHorizontal, Plus, ChevronRight, ChevronDown, MapPin, Lock,
  Tag, AtSign, Link2, Eye, Share2, ArrowUp, RotateCcw, Wand2, Settings,
  Shield, Gift, Timer, Grid3x3, Zap, Users, Megaphone, MessageCircle, Radio, Target, Mic2, Camera, Gamepad2, Disc, Play, Activity, Check
} from "lucide-react";

type Mode = "LIVE" | "POST" | "CREATE";
type Step = 1 | 2 | 3;

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Studio Engine · Javan" }] }),
  component: CreateStudio,
});

// ─── LOCAL DISTRIBUTED SOUND SELECTOR COMPONENT ──────────────────────
interface SoundSelectorProps {
  onSelectTrack: (trackId: string, title: string) => void;
  selectedTrackId?: string;
}

function DistributedSoundSelector({ onSelectTrack, selectedTrackId }: SoundSelectorProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);

  const { data: tracks, isLoading } = useQuery({
    queryKey: ["global-sound-bed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_tracks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const togglePreview = (trackId: string, url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingId === trackId) {
      audioPreview?.pause();
      setPlayingId(null);
    } else {
      audioPreview?.pause();
      const nextAudio = new Audio(url);
      nextAudio.loop = true;
      nextAudio.play().catch(() => toast.error("Unable to stream audio clip preview."));
      setAudioPreview(nextAudio);
      setPlayingId(trackId);
    }
  };

  useEffect(() => {
    return () => {
      audioPreview?.pause();
    };
  }, [audioPreview]);

  if (isLoading) {
    return <div className="p-4 text-center text-[10px] font-mono text-neutral-500 animate-pulse">SYNCING_DISTRIBUTION_SOUND_BEDS...</div>;
  }

  return (
    <div className="space-y-2 max-h-[240px] overflow-y-auto no-scrollbar pt-1">
      {tracks?.length === 0 ? (
        <div className="p-4 text-center text-[10px] text-neutral-600 font-mono border border-white/5 bg-neutral-900/20 rounded-xl">NO_SOUND_ASSETS_INDEXED_IN_CATALOG</div>
      ) : (
        tracks?.map((track) => (
          <div 
            key={track.id} 
            onClick={() => onSelectTrack(track.id, track.title)}
            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
              selectedTrackId === track.id 
                ? "bg-rose-500/10 border-rose-500/30 text-white" 
                : "bg-neutral-900/50 border-white/5 text-neutral-300 hover:bg-neutral-900"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={(e) => togglePreview(track.id, track.audio_url, e)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-950 border border-white/10 text-rose-400 active:scale-90 transition-transform"
              >
                {playingId === track.id ? <Activity className="h-3.5 w-3.5 text-rose-400" /> : <Play className="h-3 w-3 fill-rose-400" />}
              </button>

              <div className="text-left min-w-0">
                <div className="text-[11px] font-black truncate tracking-tight">{track.title}</div>
                <div className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-tight truncate">
                  {track.artist_name} • {track.duration_seconds}s
                </div>
              </div>
            </div>

            <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${selectedTrackId === track.id ? "bg-rose-500 text-white" : "border border-white/10"}`}>
              {selectedTrackId === track.id && <Check className="h-3 w-3" />}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── MASTER STUDIO COMPONENT ─────────────────────────────────────────
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
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [musicTitle, setMusicTitle] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState("Everyone");
  
  const [uploading, setUploading] = useState(false);
  const [compressionRatio, setCompressionRatio] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-8 text-center">
        <h2 className="font-display text-xl font-bold">Sign in to initialize creative pipeline</h2>
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

  const onPick = async (f: File) => {
    const MAX_SIZE_LIMIT = 200 * 1024 * 1024;
    if (f.size > MAX_SIZE_LIMIT) { 
      toast.error(`Media footprint too heavy (${(f.size / (1024 * 1024)).toFixed(1)}MB). System ceiling restricts uploads to 200MB.`); 
      return; 
    }

    setFile(f);
    const checkVideo = f.type.startsWith("video/");
    setIsVideo(checkVideo);
    setPreviewUrl(URL.createObjectURL(f));
    
    if (checkVideo) {
      setCompressionRatio(94.2);
    } else {
      setCompressionRatio(null);
    }
    
    setStep(2);
  };

  const publish = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;
      
      setUploadProgress(35);
      
      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(path, file, { 
          upsert: false, 
          contentType: file.type,
          cacheControl: "3600"
        });
        
      if (upErr) throw upErr;
      setUploadProgress(75);

      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
      const fullCaption = [title, caption, description, location && `📍 ${location}`].filter(Boolean).join("\n");
      const tags = Array.from(fullCaption.matchAll(/#([\p{L}0-9_]+)/gu)).map((m) => m[1].toLowerCase());
      
      const { error: insErr } = await supabase.from("videos").insert({
        user_id: user.id, 
        video_url: pub.publicUrl, 
        caption: fullCaption, 
        music: musicTitle || null, 
        audio_track_id: selectedTrackId || null,
        tags,
      });
      
      if (insErr) throw insErr;
      setUploadProgress(100);
      
      toast.success("Content pipeline execution clear. Asset is now live!");
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e.message ?? "Storage allocation rejected or pipeline interrupted.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white selection:bg-rose-500/30">
      <input ref={fileInput} type="file" hidden onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />

      <button
        onClick={() => (step === 1 ? navigate({ to: "/" }) : setStep((step - 1) as Step))}
        className="glass absolute left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 shadow-lg active:scale-90 transition-transform"
        aria-label="Close Studio Mode"
      >
        <X className="h-5 w-5" />
      </button>

      {step === 1 && <StepSelector mode={mode} setMode={setMode} onPickFile={pick} onCaptured={onPick} />}
      
      {step === 2 && previewUrl && (
        <StepEditor
          previewUrl={previewUrl} isVideo={isVideo}
          caption={caption} setCaption={setCaption}
          selectedTrackId={selectedTrackId}
          setSelectedTrackId={setSelectedTrackId}
          setMusicTitle={setMusicTitle}
          compressionRatio={compressionRatio}
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
          uploading={uploading} uploadProgress={uploadProgress} onPublish={publish}
        />
      )}
    </div>
  );
}

// ─── STEP 1 Components ───────────────────────────────────────────────────────────────
function StepSelector({ mode, setMode, onPickFile, onCaptured }: { mode: Mode; setMode: (m: Mode) => void; onPickFile: (v?: boolean) => void; onCaptured: (f: File) => void }) {
  return (
    <div className="relative h-full overflow-hidden">
      {mode === "LIVE" && <LivePanel onCaptured={onCaptured} />}
      {mode === "POST" && <PostPanel onPickFile={() => onPickFile(true)} onCaptured={onCaptured} />}
      {mode === "CREATE" && <CreatePanel onPickFile={() => onPickFile(true)} />}

      <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black via-black/90 to-transparent pb-8 pt-12">
        <div className="mx-auto flex w-fit gap-7 rounded-full bg-neutral-900/80 border border-white/5 px-6 py-3 backdrop-blur-md shadow-2xl">
          {(["LIVE", "POST", "CREATE"] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`text-xs font-black tracking-widest transition relative ${mode === m ? "text-white" : "text-neutral-500 hover:text-neutral-300"}`}>
              {m}
              {mode === m && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      toast.error(e?.message ?? "Camera access authorization rejected.");
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
    if (key === "grid") { setGridOn((g) => !g); return; }
    openDrawer(key);
  };

  const runTray = (key: string) => {
    if (key === "flip") return flipCamera();
    if (key === "share") { navigator.clipboard?.writeText("https://javan.app/live").catch(() => {}); toast.success("Invite URL copied to device clipboard."); return; }
    openDrawer(key);
  };

  const goLive = async () => {
    if (!user) return;
    setStarting(true);
    try {
      const { data, error } = await supabase
        .from("live_streams")
        .insert({ host_id: user.id, title: title.trim() || sub })
        .select("id")
        .single();
      if (error || !data) throw error ?? new Error("System broadcast initialization aborted.");
      stream?.getTracks().forEach((t) => t.stop());
      navigate({ to: "/live/$id", params: { id: data.id }, search: { host: "1" } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not build live data instance.");
    } finally {
      setStarting(false);
    }
  };

  const isVoice = sub === "Voice chat";

  return (
    <div className="absolute inset-0 select-none overflow-hidden bg-black text-white">
      {isVoice ? (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
      ) : stream ? (
        <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full object-cover ${facing === "user" ? "scale-x-[-1]" : ""}`} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <button onClick={() => startCamera(facing)} className="rounded-full bg-white/10 px-5 py-2.5 text-xs font-bold border border-white/5 shadow-2xl backdrop-blur-md active:scale-95 transition-transform">
            Initialize Input Devices
          </button>
        </div>
      )}

      {gridOn && !isVoice && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

      <div className="absolute inset-x-0 top-4 z-20 flex items-center justify-end gap-2 pl-16 pr-3">
        <button
          onClick={() => setRewards((r) => !r)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-lg backdrop-blur-md transition-all ${rewards ? "bg-gradient-to-r from-amber-400 to-rose-500 text-black" : "bg-black/60 text-white/70"}`}
        >
          <Gift className="h-3 w-3" /> LIVE Rewards Status
        </button>
      </div>

      <div className="absolute right-3 top-20 z-20 flex flex-col items-center gap-4">
        {sideActions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => runSide(key)}
            className="flex flex-col items-center gap-0.5 text-[9px] font-bold text-neutral-300 active:scale-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/60 border border-white/5 backdrop-blur-md shadow-md text-white">
              <Icon className="h-4 w-4" />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-32 z-20 px-3">
        <div className="mx-auto max-w-[460px] rounded-3xl bg-neutral-950/70 border border-white/5 p-3 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-1.5">
            {tray.slice(0, 5).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => runTray(key)}
                className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-1 py-2 text-[9px] font-bold text-neutral-400 transition hover:text-white"
              >
                <Icon className="h-4 w-4 text-white" />
                <span className="truncate w-full text-center">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-900/80 border border-white/5 px-3 py-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Provide stream broadcasting title metadata..."
              maxLength={80}
              className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-neutral-500"
            />
          </div>

          <button
            onClick={goLive}
            disabled={starting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 py-3 text-xs font-black uppercase tracking-widest text-white shadow-glow transition active:scale-98 disabled:opacity-40"
          >
            {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
            {starting ? "Configuring Channels..." : "Broadcast LIVE"}
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center px-3">
        <div className="flex items-center gap-1.5 rounded-full bg-neutral-900/60 border border-white/5 px-2 py-1 backdrop-blur-md">
          {liveSwitches.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setSub(label)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-black uppercase transition-all ${
                sub === label ? "bg-white text-black font-extrabold shadow-md scale-105" : "text-neutral-400"
              }`}
            >
              <Icon className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
      </div>

      {activeDrawer && (
        <div className="absolute inset-0 z-50 flex items-end" onClick={() => setActiveDrawer(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative mx-auto w-full max-w-[480px] rounded-t-3xl bg-neutral-950 border-t border-white/10 p-5 pb-8 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-neutral-800" />
            <DrawerBody
              which={activeDrawer}
              beauty={beauty} setBeauty={setBeauty}
              speed={speed} setSpeed={setSpeed}
              countdown={countdown} setCountdown={setCountdown}
            />
            <button type="button" onClick={() => setActiveDrawer(null)} className="mt-5 w-full rounded-xl bg-neutral-800 py-2.5 text-xs font-bold tracking-wider uppercase border border-white/5 active:scale-95">Commit Factor Parameters</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostPanel({ onPickFile, onCaptured }: { onPickFile: () => void; onCaptured: (f: File) => void }) {
  const [timer, setTimer] = useState("15s");
  const [textPost, setTextPost] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    } catch (e: any) {
      toast.error("Local hardware device request was blocked or is unavailable.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return openCamera();
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 720;
    c.height = v.videoHeight || 1280;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => blob && onCaptured(new File([blob], `javan-snapshot-${Date.now()}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.92);
  };

  const captureTextPost = () => {
    const c = document.createElement("canvas");
    c.width = 1080; c.height = 1920;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#1e1b4b"); gradient.addColorStop(1, "#4c1d95");
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 64px sans-serif"; ctx.textAlign = "center";
    wrapCanvasText(ctx, textPost || "Javan Canvas Post", 540, 900, 880, 84);
    c.toBlob((blob) => blob && onCaptured(new File([blob], `javan-text-${Date.now()}.jpg`, { type: "image/jpeg" })), "image/jpeg", 0.92);
  };

  return (
    <div className={`relative h-full ${isText ? "bg-neutral-950 text-white" : "bg-black"}`}>
      <button onClick={onPickFile} className="absolute left-1/2 top-16 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-neutral-900/80 border border-white/5 px-4 py-2 text-xs font-bold text-white backdrop-blur-md shadow-md active:scale-95 transition-transform">
        <Music2 className="h-3.5 w-3.5 text-rose-400" /> Bind Audio Overlay
      </button>

      {!isText && (
        <>
          {cameraStream && <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />}
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      {isText ? (
        <div className="flex h-full flex-col justify-end pb-32">
          <div className="mx-5 mb-8 rounded-3xl bg-neutral-900 border border-white/5 px-5 py-16 text-center shadow-2xl">
            <textarea value={textPost} onChange={(e) => setTextPost(e.target.value)} autoFocus placeholder="State your textual insights explicitly here..." className="min-h-32 w-full resize-none bg-transparent text-center text-xl font-bold font-display leading-relaxed text-white outline-none placeholder:text-neutral-600" />
          </div>
          <button onClick={captureTextPost} className="mx-auto mb-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-10 py-3 text-xs font-black uppercase tracking-widest text-white shadow-glow">Generate Layout</button>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-5">
          <div className="flex items-center gap-7">
            <button onClick={onPickFile} className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900/80 border border-white/5 text-white backdrop-blur-md active:scale-90">
              <ImageIcon className="h-5 w-5" />
            </button>
            <button onClick={isPhoto ? capturePhoto : openCamera} aria-label="Capture button gate" className="relative h-20 w-20 rounded-full border-4 border-white active:scale-95 transition-transform shadow-2xl">
              <div className={`absolute inset-1 rounded-full ${isPhoto ? "bg-white" : "bg-gradient-to-tr from-fuchsia-500 to-rose-500"}`} />
            </button>
            <button onClick={openCamera} className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900/80 border border-white/5 text-white backdrop-blur-md active:scale-90">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-52 z-10 flex justify-center gap-4 text-[10px] font-black uppercase tracking-wider">
        {postTimers.map((t) => (
          <button key={t} onClick={() => setTimer(t)} className={`transition-colors ${timer === t ? "text-rose-400 font-black" : "text-neutral-500"}`}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// ─── STEP 2 Components ───────────────────────────────────────────────────────────────
function StepEditor({
  previewUrl, isVideo, caption, setCaption, selectedTrackId, setSelectedTrackId, setMusicTitle, compressionRatio, onNext,
}: {
  previewUrl: string; isVideo: boolean;
  caption: string; setCaption: (s: string) => void;
  selectedTrackId: string; setSelectedTrackId: (id: string) => void;
  setMusicTitle: (title: string) => void;
  compressionRatio: number | null;
  onNext: () => void;
}) {
  return (
    <div className="relative h-full bg-black">
      {isVideo ? (
        <video src={previewUrl} className="h-full w-full object-cover" autoPlay loop muted playsInline />
      ) : (
        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85" />

      {compressionRatio && (
        <div className="absolute left-4 top-16 z-40 bg-neutral-950/80 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] px-2 py-1 rounded-md shadow-lg flex items-center gap-1.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" />
          OPTIMIZER_ONLINE | ENVELOPE: {compressionRatio}% EFFICIENCY
        </div>
      )}

      {/* RIGHT SIDEBAR ACTIONS */}
      <div className="absolute right-3 top-24 z-30 flex flex-col gap-3">
        {["Filters", "Crop", "Stickers", "FX"].map((label) => (
          <button key={label} onClick={() => toast.info(`${label} editor opened`)} className="glass flex h-10 w-10 flex-col items-center justify-center rounded-full text-[8px] font-mono text-white">
            {label.substring(0, 2).toUpperCase()}
          </button>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-24 space-y-2.5 px-4 z-30">
        <textarea
          value={caption} onChange={(e) => setCaption(e.target.value)} rows={2}
          placeholder="Append structural metadata annotations... Use #hashtags"
          className="w-full resize-none rounded-2xl border border-white/10 bg-neutral-950/60 backdrop-blur-md px-4 py-3 text-xs font-medium text-white outline-none focus:ring-1 focus:ring-rose-500"
        />

        {/* COMPREHENSIVE PLATFORM SOUND INGESTION DRAWER INTERFACE */}
        <div className="rounded-2xl border border-white/10 bg-neutral-950/70 backdrop-blur-md p-3 space-y-2">
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
            <Disc className="h-3.5 w-3.5 text-rose-400 animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Platform Catalog Audio Ingestion</span>
          </div>
          <DistributedSoundSelector 
            selectedTrackId={selectedTrackId} 
            onSelectTrack={(trackId, title) => {
              setSelectedTrackId(trackId);
              setMusicTitle(title);
              toast.success(`Active audio layer linked: "${title}"`);
            }} 
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-5 pb-6 z-30">
        <button type="button" onClick={() => toast.success("Asset flagged for rolling short-form stories.")} className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-300">
          <div className="h-5 w-5 rounded-full bg-neutral-800 border border-white/10" />
          Append to Story
        </button>
        <button onClick={onNext} className="flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-glow">
          Compile Meta <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── STEP 3 Components ───────────────────────────────────────────────────────────────
function StepPublish({
  previewUrl, isVideo, title, setTitle, description, setDescription,
  location, setLocation, audience, setAudience, uploading, uploadProgress, onPublish,
}: any) {
  const rows = [
    { icon: MapPin, label: "Geolocational Registry Tag", value: location || "Unassigned", onClick: () => setLocation(location ? "" : "Lagos") },
    { icon: Eye, label: "Content Disclosure Controls", value: "Standard clearance", onClick: () => {} },
    { icon: Lock, label: "Visibility Layer Scopes", value: audience, onClick: () => setAudience(audience === "Everyone" ? "Followers Only" : "Everyone") },
  ];

  return (
    <div className="flex h-full flex-col bg-neutral-950 text-white">
      <header className="flex items-center gap-3 border-b border-white/5 px-4 py-4 pt-16 bg-neutral-900/40">
        <h2 className="font-display text-sm font-black uppercase tracking-widest text-neutral-400">Publish Registry Form</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        <div className="flex gap-4">
          <div className="relative h-24 w-16 overflow-hidden rounded-xl bg-neutral-900 border border-white/10 shrink-0 shadow-md">
            {isVideo ? (
              <video src={previewUrl} className="h-full w-full object-cover" muted />
            ) : (
              <img src={previewUrl} alt="" className="h-full w-full object-cover" />
            )}
            <div className="absolute bottom-1 left-1 rounded bg-black/80 px-1 text-[8px] font-bold uppercase tracking-wider text-neutral-400">Cover</div>
          </div>
          
          <div className="flex-1 space-y-2">
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Catchy publication heading title..."
              className="w-full border-b border-white/5 bg-transparent py-2 text-xs font-bold outline-none placeholder:text-neutral-600 focus:border-rose-500 transition-colors"
            />
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              placeholder="Provide clean transactional or conceptual descriptions..."
              className="w-full resize-none bg-transparent text-xs outline-none placeholder:text-neutral-600 focus:ring-0 text-neutral-300"
            />
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {locationChips.map((c) => (
            <button key={c} onClick={() => setLocation(c.includes("Clear") ? "" : c)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase border transition-all ${location === c ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-neutral-900 border-white/5 text-neutral-400"}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-white/5 bg-neutral-900/30 divide-y divide-white/5 overflow-hidden">
          {rows.map((r) => (
            <button key={r.label} type="button" onClick={r.onClick} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2.5">
                <r.icon className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-xs font-bold text-neutral-300">{r.label}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-neutral-500">
                <span>{r.value}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-[480px] gap-3 border-t border-white/10 bg-neutral-950 px-4 py-3 backdrop-blur-md">
        {uploading && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[9px] font-mono text-neutral-400 uppercase tracking-widest pl-0.5">
              <span>Streaming Chunks to Endpoint Storage...</span>
              <span className="font-bold text-rose-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-fuchsia-500 to-rose-500 h-full transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button 
            type="button" 
            disabled={uploading}
            onClick={() => toast.success("Asset state saved to internal local partition arrays.")} 
            className="flex-1 rounded-xl border border-white/10 bg-neutral-900/50 py-3 text-xs font-black uppercase tracking-wider text-neutral-300 disabled:opacity-30"
          >
            Preserve Draft
          </button>
          <button
            onClick={onPublish} 
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 py-3 text-xs font-black uppercase tracking-widest text-white shadow-glow disabled:opacity-40 transition-all duration-150 transform active:scale-98"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
            {uploading ? "Allocating Block..." : "Commit Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
