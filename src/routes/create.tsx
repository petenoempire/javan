import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  X, Loader2, Music2, Image as ImageIcon, Sparkles, Scissors, Type,
  Sticker, Crop, SlidersHorizontal, Plus, ChevronRight, MapPin, Lock,
  Tag, AtSign, Link2, Eye, Share2, ArrowUp, RotateCcw, Wand2, Settings,
  Heart, UserPlus2, FileText, Camera, Video as VideoIcon, Mic2, Gamepad2,
} from "lucide-react";

type Mode = "LIVE" | "POST" | "CREATE";
type Step = 1 | 2 | 3;

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Studio · Boogle" }] }),
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
      toast.success("Posted to Boogle");
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

      {step === 1 && <StepSelector mode={mode} setMode={setMode} onPickFile={pick} />}
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

function StepSelector({ mode, setMode, onPickFile }: { mode: Mode; setMode: (m: Mode) => void; onPickFile: (v?: boolean) => void }) {
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-950/40 via-black to-black" />
      <div className="relative flex h-full flex-col">
        <div className="flex-1 overflow-y-auto px-5 pb-40 pt-20">
          {mode === "LIVE" && <LivePanel />}
          {mode === "POST" && <PostPanel onPickFile={() => onPickFile(true)} />}
          {mode === "CREATE" && <CreatePanel onPickFile={() => onPickFile(true)} />}
        </div>

        {/* Bottom mode selector */}
        <div className="absolute inset-x-0 bottom-0 pb-6 pt-4">
          <div className="mx-auto flex w-fit gap-6 px-4">
            {(["LIVE", "POST", "CREATE"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`text-sm font-bold tracking-widest transition ${mode === m ? "text-white" : "text-white/40"}`}
              >
                {m}
                {mode === m && <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const liveSubs = [
  { label: "Voice chat", icon: Mic2 },
  { label: "Device camera", icon: Camera },
  { label: "Mobile gaming", icon: Gamepad2 },
  { label: "LIVE Studio", icon: VideoIcon },
];

function LivePanel() {
  const [sub, setSub] = useState(1);
  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-5 overflow-x-auto no-scrollbar">
        {liveSubs.map((s, i) => (
          <button key={s.label} onClick={() => setSub(i)} className="flex flex-col items-center gap-1.5">
            <s.icon className={`h-7 w-7 ${sub === i ? "text-white" : "text-white/40"}`} />
            <span className={`whitespace-nowrap text-[11px] ${sub === i ? "text-white" : "text-white/50"}`}>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-32 flex flex-col items-center gap-4">
        <button className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500 shadow-[0_0_60px_-8px_rgba(244,63,94,0.8)] live-pulse">
          <span className="font-display text-sm font-bold">Go LIVE</span>
        </button>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[10px] text-white/60">
          {["Flip", "Beautify", "Effects", "Settings", "Service+", "Fan Club", "Share"].map((t) => (
            <div key={t} className="glass flex flex-col items-center gap-1 rounded-2xl px-3 py-2">
              <Wand2 className="h-4 w-4" />
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const postTimers = ["10m", "60s", "15s", "PHOTO", "TEXT"];

function PostPanel({ onPickFile }: { onPickFile: () => void }) {
  const [timer, setTimer] = useState("15s");
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="mt-4 flex w-full items-center justify-between rounded-full bg-white/10 px-4 py-2 backdrop-blur">
        <Music2 className="h-4 w-4" />
        <span className="text-xs font-semibold">Add sound</span>
        <ChevronRight className="h-4 w-4" />
      </div>

      <div className="mt-24 flex flex-col items-center gap-6">
        <div className="flex items-end gap-6">
          <button onClick={onPickFile} className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
            <ImageIcon className="h-6 w-6" />
          </button>
          <button onClick={onPickFile} aria-label="Capture" className="relative">
            <div className="h-24 w-24 rounded-full border-4 border-white" />
            <div className="absolute inset-2 rounded-full bg-white" />
          </button>
          <button className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
            <RotateCcw className="h-6 w-6" />
          </button>
        </div>

        <div className="flex gap-5 text-xs">
          {postTimers.map((t) => (
            <button key={t} onClick={() => setTimer(t)} className={`font-bold ${timer === t ? "text-rose-400" : "text-white/50"}`}>{t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const createTiles = [
  { label: "Photo editor", icon: ImageIcon },
  { label: "AutoCut", icon: Scissors },
  { label: "Captions", icon: Type },
  { label: "AI Self", icon: Sparkles },
  { label: "Cutout", icon: Crop },
];
const templates = ["For You", "Viral Song", "Sports", "Trendy"];

function CreatePanel({ onPickFile }: { onPickFile: () => void }) {
  const [tab, setTab] = useState("For You");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-2">
        {createTiles.map((t) => (
          <button key={t.label} className="glass flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3">
            <t.icon className="h-5 w-5 text-fuchsia-300" />
            <span className="text-[9px] font-semibold leading-tight text-center">{t.label}</span>
          </button>
        ))}
      </div>

      <button onClick={onPickFile} className="bg-gradient-primary flex w-full items-center justify-between rounded-3xl px-5 py-5 shadow-glow">
        <div className="text-left">
          <div className="font-display text-lg font-bold">New video</div>
          <div className="text-xs opacity-80">Pick from gallery or record</div>
        </div>
        <Plus className="h-7 w-7" />
      </button>

      <button className="glass flex w-full items-center justify-between rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" />
          <span className="text-sm font-semibold">Drafts</span>
        </div>
        <ChevronRight className="h-4 w-4 text-white/50" />
      </button>

      <div>
        <div className="mb-2 flex gap-4 overflow-x-auto no-scrollbar text-xs">
          {templates.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap font-bold ${tab === t ? "text-white" : "text-white/40"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-xl bg-gradient-to-br from-fuchsia-900/40 to-cyan-900/30" />
          ))}
        </div>
      </div>
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
          <button key={t.label} className="glass flex h-11 w-11 flex-col items-center justify-center rounded-full text-[9px]" aria-label={t.label}>
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
        <button className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold">
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
    { icon: MapPin, label: "Location", value: location || "Add location", onClick: () => {} },
    { icon: Eye, label: "Content disclosure & ads", value: "Off" },
    { icon: Link2, label: "Add link" },
    { icon: Lock, label: "Audience", value: `${audience} can view this post`, onClick: () => setAudience(audience === "Everyone" ? "Followers" : "Everyone") },
    { icon: Share2, label: "Share to other apps" },
    { icon: Settings, label: "More options" },
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
          <button className="flex h-28 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-[10px] text-white/60">
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
          <button className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5"><Tag className="h-3 w-3" /># Hashtag</button>
          <button className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5"><AtSign className="h-3 w-3" /> Mention</button>
          <button className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5"><Sparkles className="h-3 w-3" /> Description ideas</button>
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
        <button className="flex-1 rounded-full border border-white/20 py-3 text-sm font-bold">Drafts</button>
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
