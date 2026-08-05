import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CameraStudio } from "@/components/studio/CameraStudio";
import { GalleryPicker } from "@/components/studio/GalleryPicker";
import { AudioHub, type MixerState } from "@/components/studio/AudioHub";
import { TemplateHub, type StudioTemplate } from "@/components/studio/TemplateHub";
import { TimelineEditor } from "@/components/studio/TimelineEditor";
import { LiveSuite } from "@/components/studio/LiveSuite";
import { exportProject, renderThumbnail } from "@/lib/studio/exporter";
import { makeClip, type Clip, type MusicSelection, type StudioMode, type TextOverlay } from "@/lib/studio/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create Studio · Javan" },
      { name: "description", content: "Record, edit, and publish short videos with AR effects, multi-track editing, and a full audio mixer on Javan." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Create Studio · Javan" },
      { property: "og:description", content: "Record, edit, and publish short videos with AR effects, multi-track editing, and a full audio mixer on Javan." },
      { property: "og:url", content: "https://javan.lovable.app/create" },
      { name: "twitter:title", content: "Create Studio · Javan" },
      { name: "twitter:description", content: "Record, edit, and publish short videos with AR effects, multi-track editing, and a full audio mixer on Javan." },
    ],
    links: [{ rel: "canonical", href: "https://javan.lovable.app/create" }],
  }),
  component: CreatePage,
});

const TEXT_BACKGROUNDS = [
  ["#f43f5e", "#a21caf"],
  ["#0ea5e9", "#4338ca"],
  ["#f59e0b", "#ef4444"],
  ["#10b981", "#0f766e"],
  ["#111827", "#374151"],
];

type Stage = "capture" | "edit" | "publish";

function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<StudioMode>("60s");
  const [stage, setStage] = useState<Stage>("capture");
  const [clips, setClipsState] = useState<Clip[]>([]);
  const [overlays, setOverlaysState] = useState<TextOverlay[]>([]);
  const [music, setMusic] = useState<MusicSelection | null>(null);
  const [mixer, setMixer] = useState<MixerState>({ original: 1, music: 0.6, voice: 1 });
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const [textValue, setTextValue] = useState("");
  const [textBg, setTextBg] = useState(0);

  const setClips = (updater: (c: Clip[]) => Clip[]) => setClipsState((prev) => updater(prev));
  const setOverlays = (updater: (o: TextOverlay[]) => TextOverlay[]) => setOverlaysState((prev) => updater(prev));

  const applyTemplate = (t: StudioTemplate) => {
    setTemplatesOpen(false);
    if (clips.length === 0) {
      toast.info(`${t.name} ready — record or upload clips and it will auto-sync`);
      setCaption((c) => c || t.captionIdea);
      return;
    }
    setClipsState((prev) =>
      prev.map((c) => ({
        ...c,
        filter: t.filter,
        trimEnd: Math.min(c.duration, c.trimStart + t.segment),
      })),
    );
    setCaption((c) => c || t.captionIdea);
    toast.success(`${t.name} applied to ${clips.length} clip${clips.length === 1 ? "" : "s"}`);
    setStage("edit");
  };

  const makeTextCard = async () => {
    if (!textValue.trim()) {
      toast.error("Write something first");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;
    const [a, b] = TEXT_BACKGROUNDS[textBg];
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, a);
    grad.addColorStop(1, b);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 84px system-ui, sans-serif";
    const words = textValue.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > canvas.width - 160) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => ctx.fillText(l, canvas.width / 2, canvas.height / 2 + (i - (lines.length - 1) / 2) * 104));
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    if (!blob) return;
    const clip = await makeClip(blob, "image");
    setClipsState((prev) => [...prev, clip]);
    setTextValue("");
    setStage("edit");
  };

  const publish = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in to publish");
      if (clips.length === 0) throw new Error("Nothing to publish");

      const onlyPhoto = clips.length === 1 && clips[0].kind === "image" && overlays.length === 0 && !music;

      if (onlyPhoto) {
        const path = `${user.id}/${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("videos")
          .upload(path, clips[0].blob, { contentType: "image/jpeg" });
        if (error) throw error;
        const { data } = supabase.storage.from("videos").getPublicUrl(path);
        const { error: insErr } = await supabase
          .from("stories")
          .insert({ user_id: user.id, media_url: data.publicUrl, media_type: "image", caption });
        if (insErr) throw insErr;
        return "story" as const;
      }

      setProgress(0.01);
      const blob = await exportProject({
        clips,
        overlays,
        musicUrl: music?.url ?? null,
        musicVolume: mixer.music,
        originalVolume: mixer.original,
        voiceoverUrl,
        voiceoverVolume: mixer.voice,
        onProgress: setProgress,
      });

      const base = `${user.id}/${Date.now()}`;
      const { error: upErr } = await supabase.storage
        .from("videos")
        .upload(`${base}.webm`, blob, { contentType: "video/webm" });
      if (upErr) throw upErr;
      const { data: videoUrl } = supabase.storage.from("videos").getPublicUrl(`${base}.webm`);

      let thumbnailUrl: string | null = null;
      const thumb = await renderThumbnail(clips[0]);
      if (thumb) {
        const { error: tErr } = await supabase.storage
          .from("videos")
          .upload(`${base}.jpg`, thumb, { contentType: "image/jpeg" });
        if (!tErr) thumbnailUrl = supabase.storage.from("videos").getPublicUrl(`${base}.jpg`).data.publicUrl;
      }

      const tags = Array.from(caption.matchAll(/#(\w+)/g)).map((m) => m[1]);
      const { error: insErr } = await supabase.from("videos").insert({
        user_id: user.id,
        video_url: videoUrl.publicUrl,
        thumbnail_url: thumbnailUrl,
        caption,
        music: music?.title ?? null,
        tags,
      });
      if (insErr) throw insErr;
      return "video" as const;
    },
    onSuccess: (kind) => {
      toast.success(kind === "story" ? "Story posted!" : "Published to your feed!");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      navigate({ to: "/" });
    },
    onError: (err: any) => {
      setProgress(0);
      toast.error(err?.message ?? "Couldn't publish");
    },
  });

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <h1 className="sr-only">Create a post</h1>
          <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <Camera className="mx-auto mb-4 h-10 w-10 text-white/20" />
            <p className="text-sm text-white/50">Join the Javan creator community to share your moments.</p>
          </div>
          <Link to="/auth" className="bg-gradient-primary w-full rounded-2xl py-4 text-sm font-bold text-white shadow-glow">
            Sign In to Create
          </Link>
        </div>
      </MobileShell>
    );
  }

  const modals = (
    <>
      <GalleryPicker
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onAdd={(added) => {
          setClipsState((prev) => [...prev, ...added]);
          setStage("edit");
        }}
      />
      <AudioHub
        open={audioOpen}
        onClose={() => setAudioOpen(false)}
        music={music}
        onMusic={setMusic}
        mixer={mixer}
        onMixer={setMixer}
        voiceoverUrl={voiceoverUrl}
        onVoiceover={setVoiceoverUrl}
      />
      <TemplateHub open={templatesOpen} onClose={() => setTemplatesOpen(false)} onApply={applyTemplate} />
    </>
  );

  if (stage === "publish") {
    return (
      <div className="fixed inset-0 z-[75] flex flex-col bg-black text-white">
        <h1 className="sr-only">Publish your post</h1>
        <header className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setStage("edit")} aria-label="Back to editor" className="rounded-full bg-white/10 p-2 active:scale-90">
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-black uppercase tracking-widest">Publish</span>
          <span className="w-9" />
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="mx-auto h-64 w-40 overflow-hidden rounded-2xl bg-white/5">
            {clips[0]?.kind === "video" ? (
              <video src={clips[0].url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
            ) : clips[0] ? (
              <img src={clips[0].url} alt="Post preview" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <label htmlFor="caption" className="sr-only">Caption</label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Write a caption and #hashtags…"
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <div className="rounded-2xl bg-white/5 px-4 py-3 text-xs text-white/60">
            Sound: {music?.title ?? "Original audio"} · {clips.length} clip{clips.length === 1 ? "" : "s"}
          </div>
          {publish.isPending && progress > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
          )}
        </div>
        <div className="px-5 pb-6">
          <button
            onClick={() => publish.mutate()}
            disabled={publish.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3.5 text-sm font-black disabled:opacity-50 active:scale-95"
          >
            {publish.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {progress > 0 ? `Rendering ${Math.round(progress * 100)}%` : "Uploading…"}</>
            ) : (
              <><Check className="h-4 w-4" /> Post</>
            )}
          </button>
        </div>
        {modals}
      </div>
    );
  }

  if (stage === "edit") {
    return (
      <>
        <TimelineEditor
          clips={clips}
          setClips={setClips}
          overlays={overlays}
          setOverlays={setOverlays}
          music={music}
          onOpenAudio={() => setAudioOpen(true)}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onClose={() => setStage("capture")}
          onNext={() => setStage("publish")}
        />
        {modals}
      </>
    );
  }

  if (mode === "live") {
    return (
      <>
        <LiveSuite mode={mode} onMode={setMode} onClose={() => navigate({ to: "/" })} />
        {modals}
      </>
    );
  }

  if (mode === "text") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col text-white" style={{ background: `linear-gradient(135deg, ${TEXT_BACKGROUNDS[textBg][0]}, ${TEXT_BACKGROUNDS[textBg][1]})` }}>
        <h1 className="sr-only">Create a text post</h1>
        <header className="flex items-center justify-between px-4 pt-5">
          <button onClick={() => navigate({ to: "/" })} aria-label="Close" className="rounded-full bg-black/30 p-2.5 active:scale-90">
            <X className="h-5 w-5" />
          </button>
          <button onClick={makeTextCard} className="rounded-full bg-white px-4 py-2 text-xs font-black text-black active:scale-95">
            Next
          </button>
        </header>
        <label htmlFor="text-post" className="sr-only">Text</label>
        <textarea
          id="text-post"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="Type something…"
          className="flex-1 resize-none bg-transparent px-8 py-10 text-center text-3xl font-black outline-none placeholder:text-white/50"
        />
        <div className="flex justify-center gap-3 pb-4">
          {TEXT_BACKGROUNDS.map(([a, b], i) => (
            <button key={a} onClick={() => setTextBg(i)} aria-label={`Background ${i + 1}`}
              className={`h-9 w-9 rounded-full border-2 ${textBg === i ? "border-white" : "border-white/30"}`}
              style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
          ))}
        </div>
        <div className="pb-6">
          <ModeCarouselWrapper mode={mode} onMode={setMode} />
        </div>
        {modals}
      </div>
    );
  }

  return (
    <>
      <CameraStudio
        mode={mode}
        onMode={setMode}
        clips={clips}
        onClips={setClips}
        onOpenGallery={() => setGalleryOpen(true)}
        onOpenAudio={() => setAudioOpen(true)}
        onOpenTemplates={() => setTemplatesOpen(true)}
        onOpenEditor={() => setStage("edit")}
        onClose={() => navigate({ to: "/" })}
        musicLabel={music?.title ?? null}
      />
      {modals}
    </>
  );
}

function ModeCarouselWrapper({ mode, onMode }: { mode: StudioMode; onMode: (m: StudioMode) => void }) {
  const { ModeCarousel } = require("@/components/studio/ModeCarousel");
  return <ModeCarousel value={mode} onChange={onMode} />;
}
