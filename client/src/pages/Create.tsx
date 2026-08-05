import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { CameraEngine } from "@/components/CameraEngine";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export default function Create() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedType, setCapturedType] = useState<"photo" | "video" | null>(
    null
  );
  const [capturedUrl, setCapturedUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const publishMutation = trpc.posts.create.useMutation({
    onSuccess: () => {
      toast.success("Posted successfully!");
      navigate("/");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish post");
    },
  });

  const handleCapture = async (blob: Blob, type: "photo" | "video") => {
    setCapturedBlob(blob);
    setCapturedType(type);
    setCapturedUrl(URL.createObjectURL(blob));
    setShowCamera(false);
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setCapturedType(null);
    setCapturedUrl("");
    setCaption("");
    setShowCamera(true);
  };

  const handlePublish = async () => {
    if (!capturedBlob || !capturedType || !user) {
      toast.error("Missing required data");
      return;
    }

    setIsUploading(true);

    try {
      // For now, create post with placeholder S3 key
      // In production, this would upload to S3 first
      const s3Key = `posts/${user.id}/${Date.now()}`;
      const url = `/manus-storage/${encodeURIComponent(s3Key)}`;

      // Create post record
      await publishMutation.mutateAsync({
        caption,
        mediaType: capturedType,
        photoUrl: capturedType === "photo" ? url : undefined,
        videoUrl: capturedType === "video" ? url : undefined,
        s3Key,
        format: "photo",
        hashtags: [],
      });
    } catch (error) {
      console.error("Publish error:", error);
      toast.error("Failed to publish post");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-center px-8 bg-black">
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-6">
          <p className="text-sm text-white/50 mb-6">
            Join the Javan creator community to share your moments.
          </p>
          <Button
            onClick={startLogin}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-rose-600"
          >
            Sign In to Create
          </Button>
        </div>
      </div>
    );
  }

  if (showCamera) {
    return (
      <CameraEngine
        onCapture={handleCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  if (capturedBlob && capturedUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
        <div className="relative flex-1">
          {capturedType === "video" ? (
            <video
              src={capturedUrl}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <img
              src={capturedUrl}
              alt="Captured preview"
              className="h-full w-full object-contain"
            />
          )}
          <button
            onClick={handleRetake}
            aria-label="Retake"
            className="absolute top-6 left-4 rounded-full bg-black/50 p-2 active:scale-90 transition-transform"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3 bg-black border-t border-white/10">
          <label htmlFor="caption-input" className="sr-only">
            Caption
          </label>
          <Input
            id="caption-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            maxLength={500}
            className="bg-white/10 border-white/10 text-white placeholder:text-white/50"
          />

          <Button
            onClick={handlePublish}
            disabled={isUploading || publishMutation.isPending}
            className="w-full bg-gradient-to-r from-fuchsia-600 to-rose-600 flex items-center justify-center gap-2"
          >
            {isUploading || publishMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Publish Post
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <Button
        onClick={() => setShowCamera(true)}
        className="bg-gradient-to-r from-fuchsia-600 to-rose-600 px-8 py-6 text-lg"
      >
        Start Creating
      </Button>
    </div>
  );
}
