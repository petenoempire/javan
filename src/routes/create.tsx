import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Video, FileText, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({ 
  head: () => ({ meta: [{ title: "Create · Javan" }] }),
  component: CreatePage,
});

function CreatePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!content.trim()) throw new Error("Content is required");
      if (!user) throw new Error("Not authenticated");

      let videoUrl = null;
      if (videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile);
        const uploadRes = await fetch("/api/v1/media/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Video upload failed");
        const { url } = await uploadRes.json();
        videoUrl = url;
      }

      const res = await fetch("/api/v1/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          content,
          video_url: videoUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Post created!");
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      setContent("");
      setVideoFile(null);
      setPreviewUrl("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create post");
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  if (!user) {
    return (
      <MobileShell>
        <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
          <p className="text-sm text-white/50 mb-4">Sign in to create posts</p>
          <Link
            to="/auth"
            className="bg-gradient-to-r from-fuchsia-600 to-rose-600 px-6 py-2.5 rounded-full text-sm font-bold text-white"
          >
            Sign In
          </Link>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-4 pt-4 pb-20">
        <h1 className="font-display text-2xl font-black mb-6">Create Post</h1>

        <div className="space-y-4">
          {/* Content Input */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">What's on your mind?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              maxLength={500}
              className="w-full mt-2 rounded-2xl bg-white/5 border border-white/10 p-4 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none transition-all"
              rows={5}
            />
            <p className="text-[10px] text-white/50 mt-1">{content.length} / 500</p>
          </div>

          {/* Video Upload */}
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Video (Optional)</label>
            <div className="mt-2 relative">
              {previewUrl ? (
                <div className="relative rounded-2xl overflow-hidden bg-black/50">
                  <video
                    src={previewUrl}
                    className="w-full aspect-video object-cover"
                    controls
                  />
                  <button
                    onClick={() => {
                      setVideoFile(null);
                      setPreviewUrl("");
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-all"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center rounded-2xl border-2 border-dashed border-white/20 p-8 cursor-pointer hover:border-white/40 hover:bg-white/5 transition-all">
                  <div className="text-center">
                    <Video className="h-8 w-8 text-white/50 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white/50">Upload video</p>
                    <p className="text-[10px] text-white/40 mt-1">MP4, WebM (max 100MB)</p>
                  </div>
                  <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={() => createPostMutation.mutate()}
            disabled={createPostMutation.isPending || !content.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3 text-sm font-bold text-white disabled:opacity-50 active:scale-95 transition-all hover:from-fuchsia-500 hover:to-rose-500"
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Publish Post
              </>
            )}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
