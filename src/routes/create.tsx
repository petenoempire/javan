import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadCloud, Loader2, Music2, Hash } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({ meta: [{ title: "Upload · Admiralty" }] }),
  component: Create,
});

function Create() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [music, setMusic] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pick = () => fileInput.current?.click();
  const onPick = (f: File) => {
    if (!f.type.startsWith("video/")) { toast.error("Please choose a video file"); return; }
    if (f.size > 200 * 1024 * 1024) { toast.error("Max 200MB"); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!file) return;
    setUploading(true); setProgress(10);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      setProgress(80);
      const { data: pub } = supabase.storage.from("videos").getPublicUrl(path);
      const tags = Array.from(caption.matchAll(/#([\p{L}0-9_]+)/gu)).map((m) => m[1].toLowerCase());
      const { error: insErr } = await supabase.from("videos").insert({
        user_id: user.id,
        video_url: pub.publicUrl,
        caption,
        music: music || null,
        tags,
      });
      if (insErr) throw insErr;
      setProgress(100);
      toast.success("Video published");
      navigate({ to: "/profile" });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center px-8 text-center">
          <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="font-display text-xl font-bold">Sign in to upload</h2>
          <Link to="/auth" className="bg-gradient-primary mt-5 rounded-full px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">Sign in</Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-5 pt-20">
        <h1 className="font-display text-3xl font-bold">Upload</h1>
        <p className="mt-1 text-sm text-muted-foreground">Share a real moment with your community.</p>

        <input ref={fileInput} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />

        {!previewUrl ? (
          <button onClick={pick} className="glass mt-6 flex aspect-[9/16] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border">
            <UploadCloud className="h-10 w-10 text-primary" />
            <div className="font-display font-semibold">Choose a video</div>
            <div className="text-xs text-muted-foreground">MP4, MOV, WebM · up to 200MB</div>
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <video src={previewUrl} controls className="aspect-[9/16] w-full rounded-3xl bg-black object-cover" />
            <button onClick={pick} className="glass w-full rounded-full py-2 text-xs">Choose another</button>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Caption</span>
            <textarea
              value={caption} onChange={(e) => setCaption(e.target.value)} rows={3}
              placeholder="What's the story? Use #tags"
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Sound</span>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <Music2 className="h-4 w-4 text-muted-foreground" />
              <input value={music} onChange={(e) => setMusic(e.target.value)} placeholder={`Original sound · ${profile?.handle ?? "you"}`} className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </label>
          {caption.match(/#\w+/g) && (
            <div className="flex flex-wrap gap-1.5">
              {caption.match(/#\w+/g)!.map((t) => (
                <span key={t} className="glass flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"><Hash className="h-2.5 w-2.5" />{t.slice(1)}</span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={upload}
          disabled={!file || uploading}
          className="bg-gradient-primary mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {progress}%</> : "Publish"}
        </button>
      </div>
    </MobileShell>
  );
}
