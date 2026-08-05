import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  RotateCw,
  Sparkles,
  MonitorPlay,
  Dog,
  X,
  Circle,
  Square,
  Check,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  initFaceLandmarker,
  initSegmenter,
  detectFace,
  getSegmentationMask,
  drawDogEars,
  applyBeautyFilter,
  applyGreenScreenRemoval,
  applyColorFilter,
} from "@/lib/arEffects";

export type ARMode = "none" | "dogEars" | "beauty" | "greenScreen";
export type ColorFilterKey = "none" | "warm" | "cool" | "mono" | "vivid" | "vintage" | "noir";

const AR_MODES: { key: ARMode; label: string; icon: any }[] = [
  { key: "none", label: "None", icon: X },
  { key: "dogEars", label: "Dog Ears", icon: Dog },
  { key: "beauty", label: "Beauty", icon: Sparkles },
  { key: "greenScreen", label: "Green Screen", icon: MonitorPlay },
];

const COLOR_FILTERS: Record<ColorFilterKey, { label: string }> = {
  none: { label: "Normal" },
  warm: { label: "Warm" },
  cool: { label: "Cool" },
  mono: { label: "Mono" },
  vivid: { label: "Vivid" },
  vintage: { label: "Vintage" },
  noir: { label: "Noir" },
};

interface CameraEngineProps {
  onCapture?: (blob: Blob, type: "photo" | "video") => void;
  onClose?: () => void;
}

export const CameraEngine: React.FC<CameraEngineProps> = ({
  onCapture,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<ColorFilterKey>("none");
  const [arMode, setArMode] = useState<ARMode>("none");
  const [arLoading, setArLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<number | null>(null);

  // Load AR models when mode changes
  useEffect(() => {
    if (arMode === "none") return;
    let cancelled = false;
    setArLoading(true);

    const load = async () => {
      try {
        if (arMode === "greenScreen") {
          await initSegmenter();
        } else {
          await initFaceLandmarker();
        }
      } catch (err) {
        if (!cancelled) toast.error("Couldn't load AR effect on this device");
      } finally {
        if (!cancelled) setArLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [arMode]);

  // Initialize camera
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
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Enable it in your browser settings."
          : "Couldn't access the camera on this device."
      );
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, startCamera]);

  // Render loop: draw video + AR effects to canvas
  useEffect(() => {
    if (!cameraReady) return;

    const loop = () => {
      const video = videoRef.current;
      const canvas = outputCanvasRef.current;

      if (video && canvas && video.videoWidth > 0) {
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw video frame
        ctx.drawImage(video, 0, 0);

        // Apply color filter
        if (colorFilter !== "none") {
          applyColorFilter(ctx, colorFilter);
          ctx.drawImage(canvas, 0, 0);
        }

        // Apply AR effects
        if (arMode === "greenScreen") {
          const mask = getSegmentationMask(video);
          if (mask) {
            applyGreenScreenRemoval(ctx, mask, backgroundImageRef.current);
          }
        } else if (arMode === "beauty") {
          const faceLandmarks = detectFace(video);
          if (faceLandmarks) {
            applyBeautyFilter(ctx, faceLandmarks);
          }
        } else if (arMode === "dogEars") {
          const faceLandmarks = detectFace(video);
          if (faceLandmarks) {
            drawDogEars(ctx, faceLandmarks);
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cameraReady, arMode, colorFilter]);

  const flipCamera = () => {
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    const outputCanvas = outputCanvasRef.current;
    const captureCanvas = captureCanvasRef.current;

    if (!outputCanvas || !captureCanvas) return;

    captureCanvas.width = outputCanvas.width;
    captureCanvas.height = outputCanvas.height;

    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(outputCanvas, 0, 0);
    captureCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture?.(blob, "photo");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      },
      "image/jpeg",
      0.92
    );
  };

  const startRecording = () => {
    const outputCanvas = outputCanvasRef.current;
    if (!outputCanvas || !streamRef.current) return;

    const canvasStream = outputCanvas.captureStream(30);
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach((track) => canvasStream.addTrack(track));

    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      onCapture?.(blob, "video");
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
    onCapture?.(file, isVideo ? "video" : "photo");
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const handleBackgroundSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      backgroundImageRef.current = img;
    };
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleGallerySelect}
        className="hidden"
      />
      <input
        ref={bgInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackgroundSelect}
        className="hidden"
      />

      {/* Main viewport */}
      <div className="relative flex-1 overflow-hidden">
        {cameraError ? (
          <div className="flex h-full items-center justify-center px-8 text-center">
            <p className="text-sm text-white/60">{cameraError}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            <canvas
              ref={outputCanvasRef}
              className="h-full w-full object-cover"
            />
          </>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 left-4 rounded-full bg-black/50 p-2 active:scale-90 transition-transform"
            aria-label="Close camera"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Recording timer */}
        {isRecording && (
          <div className="absolute top-6 right-4 bg-red-600 rounded-full px-4 py-2 text-sm font-bold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {recordSeconds}s
          </div>
        )}
      </div>

      {/* Right-side action column */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <button
          onClick={flipCamera}
          className="rounded-full bg-white/20 p-3 active:scale-90 transition-transform"
          aria-label="Flip camera"
        >
          <RotateCw className="h-5 w-5" />
        </button>

        {/* AR Mode selector */}
        <div className="flex flex-col gap-2">
          {AR_MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setArMode(mode.key)}
              disabled={arLoading}
              className={`rounded-full p-3 transition-all ${
                arMode === mode.key
                  ? "bg-gradient-to-r from-fuchsia-600 to-cyan-600"
                  : "bg-white/20 hover:bg-white/30"
              } active:scale-90 disabled:opacity-50`}
              title={mode.label}
            >
              <mode.icon className="h-5 w-5" />
            </button>
          ))}
        </div>

        {/* Color filter selector */}
        <div className="flex flex-col gap-2">
          {(Object.keys(COLOR_FILTERS) as ColorFilterKey[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setColorFilter(filter)}
              className={`rounded-full w-10 h-10 transition-all ${
                colorFilter === filter
                  ? "ring-2 ring-cyan-400"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor:
                  filter === "none"
                    ? "rgba(255, 255, 255, 0.2)"
                    : filter === "warm"
                      ? "rgba(255, 200, 100, 0.5)"
                      : filter === "cool"
                        ? "rgba(100, 200, 255, 0.5)"
                        : filter === "mono"
                          ? "rgba(128, 128, 128, 0.5)"
                          : filter === "vivid"
                            ? "rgba(255, 100, 200, 0.5)"
                            : filter === "vintage"
                              ? "rgba(200, 150, 100, 0.5)"
                              : "rgba(50, 50, 50, 0.5)",
              }}
              title={COLOR_FILTERS[filter].label}
            />
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="px-4 py-6 space-y-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        {/* Format carousel - placeholder for now */}
        <div className="flex gap-2 overflow-x-auto pb-4">
          {["Photo", "Video", "Story", "Live", "Duet", "Template"].map(
            (mode) => (
              <button
                key={mode}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium whitespace-nowrap transition-colors"
              >
                {mode}
              </button>
            )
          )}
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full bg-white/20 p-3 active:scale-90 transition-transform"
            aria-label="Gallery"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          {/* Shutter button */}
          <button
            onMouseDown={handleShutterHold}
            onMouseUp={stopRecording}
            onClick={handleShutterPress}
            className="rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-600 p-6 active:scale-95 transition-transform shadow-lg"
            aria-label={isRecording ? "Stop recording" : "Take photo"}
          >
            {isRecording ? (
              <Square className="h-6 w-6 fill-white" />
            ) : (
              <Circle className="h-6 w-6 fill-white" />
            )}
          </button>

          <button
            onClick={() => bgInputRef.current?.click()}
            className="rounded-full bg-white/20 p-3 active:scale-90 transition-transform"
            aria-label="Background"
          >
            <MonitorPlay className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={captureCanvasRef} className="hidden" />
    </div>
  );
};
