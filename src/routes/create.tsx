import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { MobileShell } from "@/components/MobileShell";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, RotateCw, Circle, Square, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/create")({ 
  head: () => ({ meta: [{ title: "Create · Javan" }] }),
  component: CreatePage,
});

type FilterKey = "none" | "warm" | "cool" | "mono" | "vivid" | "vintage" | "noir";

const FILTERS: Record<FilterKey, { label: string; css: string }> = {
  none: { label: "Normal", css: "none" },
  warm: { label: "Warm", css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  cool: { label: "Cool", css: "hue-rotate(15deg) saturate(1.2) brightness(1.05)" },
  mono: { label: "Mono", css: "grayscale(1) contrast(1.1)" },
  vivid: { label: "Vivid", css: "saturate(1.8) contrast(1.15)" },
  vintage: { label: "Vintage", css: "sepia(0.5) contrast(0.9) brightness(0.95) saturate(0.8)" },
  noir: { label: "Noir", css: "grayscale(1) contrast(1.4) brightness(0.9)" },
};

function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("none");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<number | null>(null);

  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedType, setCapturedType] = useState<"image" | "video" | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string>("");
  const [caption, setCaption] = useState("");

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Enable it in your browser settings to record."
          : "Couldn't access the camera on this device."
      );
    }
  }, [facingMode]);

  useEffect(() => {
    if (!capturedBlob) startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera, capturedBlob]);

  const flipCamera = () => {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.filter = FILTERS[selectedFilter].css;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        setCapturedType("image");
        setCapturedUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
      },
      "image/jpeg",
      0.92
    );
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      setCapturedBlob(blob);
      setCapturedType("video");
      setCapturedUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setRecordSeconds(0);
    recordTimerRef.current = window.setInterval(() => {
      setRecordSeconds((s) => {
        if (s >= 59) {
          stopRecording();
          return s;
        }
        return s + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
  };

  const handleShutterPress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      capturePhoto();
    }
  };

  const handleShutterHold = () => {
    if (!isRecording) startRecording();
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setCapturedBlob(file);
    setCapturedType(isVideo ? "video" : "image");
    setCapturedUrl(URL.createObjectURL(file));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const retake = () => {
    setCapturedBlob(null);
    setCapturedType(null);
    setCapturedUrl("");
    setCaption("");
    setSelectedFilter("none");
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!capturedBlob || !capturedType || !user) throw new Error("Nothing to publish");

      const ext = capturedType === "video" ? "webm" : "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(path, capturedBlob, {
          contentType: capturedType === "video" ? "video/webm" : "image/jpeg",
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);

      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: caption,
        video_url: capturedType === "video" ? urlData.publicUrl : null,
        image_url: capturedType === "image" ? urlData.publicUrl : null,
        media_type: capturedType,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Posted!");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      navigate({ to: "/" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish post");
    },
  });

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

  // Review screen after capture
  if (capturedBlob && capturedUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
        <div className="relative flex-1">
          {capturedType === "video" ? (
            <video src={capturedUrl} autoPlay loop muted playsInline className="h-full w-full object-contain" />
          ) : (
            <img
              src={capturedUrl}
              alt=""
              className="h-full w-full object-contain"
              style={{ filter: FILTERS[selectedFilter].css }}
            />
          )}
          <button
            onClick={retake}
            className="absolute top-6 left-4 rounded-full bg-black/50 p-2 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-4 space-y-3 bg-black">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            maxLength={500}
            className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <button
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 py-3 text-sm font-bold disabled:opacity-50 active:scale-95 transition-all"
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Publish Post
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Live camera screen
  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleGallerySelect}
        className="hidden"
      />
      <div className="relative flex-1 overflow-hidden">
        {cameraError ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p className="text-sm text-white/60">{cameraError}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ filter: FILTERS[selectedFilter].css, transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute top-6 left-4 z-10 rounded-full bg-black/40 p-2 active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
        <button
          onClick={flipCamera}
          className="absolute top-6 right-4 z-10 rounded-full bg-black/40 p-2 active:scale-90"
        >
          <RotateCw className="h-5 w-5" />
        </button>

        {isRecording && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-black">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
            {String(recordSeconds % 60).padStart(2, "0")}
          </div>
        )}

        {/* Filter selector */}
        <div className="absolute bottom-28 inset-x-0 z-10 flex gap-2 overflow-x-auto px-4 pb-1">
          {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedFilter(key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
                selectedFilter === key
                  ? "bg-white text-black"
                  : "bg-black/40 text-white border border-white/20"
              }`}
            >
              {FILTERS[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 bg-black">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 active:scale-90"
        >
          <ImageIcon className="h-5 w-5" />
        </button>

        <button
          onClick={handleShutterPress}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => {
            const timer = setTimeout(handleShutterHold, 350);
            const clear = () => {
              clearTimeout(timer);
              document.removeEventListener("touchend", clear);
            };
            document.addEventListener("touchend", clear);
          }}
          disabled={!cameraReady}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white active:scale-90 transition-all disabled:opacity-40"
        >
          {isRecording ? (
            <Square className="h-6 w-6 fill-red-500 text-red-500" />
          ) : (
            <Circle className="h-12 w-12 fill-white text-white" />
          )}
        </button>

        <div className="w-11" />
      </div>
    </div>
  );
}
