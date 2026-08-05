/**
 * AR Effects using MediaPipe Face Detection and Selfie Segmentation
 * Provides real-time face detection, beauty filters, and green screen background removal
 */

let faceLandmarker: any = null;
let segmenter: any = null;

/**
 * Initialize Face Landmarker for face detection and AR effects
 */
export async function initFaceLandmarker() {
  if (faceLandmarker) return;

  try {
    const { FaceLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm/face_landmarker.task",
      },
      runningMode: "VIDEO",
      numFaces: 1,
    });

    console.log("[AR] Face Landmarker initialized");
  } catch (error) {
    console.error("[AR] Failed to initialize Face Landmarker:", error);
    throw error;
  }
}

/**
 * Initialize Selfie Segmenter for background removal
 */
export async function initSegmenter() {
  if (segmenter) return;

  try {
    const vision = await import("@mediapipe/tasks-vision");
    const { FilesetResolver } = vision;

    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    // Use the generic createFromOptions approach
    const SelfieSegmenterClass = (vision as any).SelfieSegmenter;
    if (!SelfieSegmenterClass) {
      throw new Error("SelfieSegmenter not found in MediaPipe tasks-vision");
    }

    segmenter = await SelfieSegmenterClass.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath:
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm/selfie_segmenter.tflite",
      },
      runningMode: "VIDEO",
      outputCategoryMask: true,
    });

    console.log("[AR] Selfie Segmenter initialized");
  } catch (error) {
    console.error("[AR] Failed to initialize Selfie Segmenter:", error);
    throw error;
  }
}

/**
 * Detect face landmarks in video frame
 */
export function detectFace(video: HTMLVideoElement) {
  if (!faceLandmarker) return null;

  try {
    const results = faceLandmarker.detectForVideo(video, performance.now());
    return results.faceLandmarks?.[0] ?? null;
  } catch (error) {
    console.error("[AR] Face detection error:", error);
    return null;
  }
}

/**
 * Get segmentation mask for background removal
 */
export function getSegmentationMask(video: HTMLVideoElement) {
  if (!segmenter) return null;

  try {
    const results = segmenter.segmentForVideo(video, performance.now());
    return results.categoryMask;
  } catch (error) {
    console.error("[AR] Segmentation error:", error);
    return null;
  }
}

/**
 * Draw dog ears AR effect on canvas
 */
export function drawDogEars(
  ctx: CanvasRenderingContext2D,
  faceLandmarks: any,
  scale: number = 1
) {
  if (!faceLandmarks || faceLandmarks.length === 0) return;

  // Get face bounding box
  const xCoords = faceLandmarks.map((p: any) => p.x);
  const yCoords = faceLandmarks.map((p: any) => p.y);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  const faceWidth = (maxX - minX) * ctx.canvas.width;
  const faceHeight = (maxY - minY) * ctx.canvas.height;
  const faceTop = minY * ctx.canvas.height;
  const faceLeft = minX * ctx.canvas.width;

  // Draw left ear
  ctx.fillStyle = "rgba(139, 69, 19, 0.8)";
  ctx.beginPath();
  ctx.ellipse(
    faceLeft - faceWidth * 0.15,
    faceTop - faceHeight * 0.2,
    faceWidth * 0.12,
    faceHeight * 0.2,
    -0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw right ear
  ctx.beginPath();
  ctx.ellipse(
    faceLeft + faceWidth + faceWidth * 0.15,
    faceTop - faceHeight * 0.2,
    faceWidth * 0.12,
    faceHeight * 0.2,
    0.3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

/**
 * Apply beauty filter to canvas
 */
export function applyBeautyFilter(
  ctx: CanvasRenderingContext2D,
  faceLandmarks: any
) {
  if (!faceLandmarks || faceLandmarks.length === 0) return;

  // Apply subtle blur and brightness enhancement
  ctx.filter = "blur(1px) brightness(1.05) saturate(1.1)";
  ctx.drawImage(ctx.canvas, 0, 0);
  ctx.filter = "none";
}

/**
 * Apply green screen background removal
 */
export function applyGreenScreenRemoval(
  ctx: CanvasRenderingContext2D,
  mask: any,
  backgroundImage: HTMLImageElement | null
) {
  if (!mask) return;

  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const maskData = mask.getAsFloat32Array();

  // Create alpha mask from segmentation
  for (let i = 0; i < maskData.length; i++) {
    const alpha = Math.round(maskData[i] * 255);
    data[i * 4 + 3] = alpha; // Set alpha channel
  }

  ctx.putImageData(imageData, 0, 0);

  // Draw background if provided
  if (backgroundImage) {
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }
}

/**
 * Apply color filter to canvas
 */
export function applyColorFilter(
  ctx: CanvasRenderingContext2D,
  filterType: string
) {
  const filters: Record<string, string> = {
    none: "none",
    warm: "sepia(0.3) saturate(1.4) brightness(1.05)",
    cool: "hue-rotate(15deg) saturate(1.2) brightness(1.05)",
    mono: "grayscale(1) contrast(1.1)",
    vivid: "saturate(1.8) contrast(1.15)",
    vintage: "sepia(0.5) contrast(0.9) brightness(0.95) saturate(0.8)",
    noir: "grayscale(1) contrast(1.4) brightness(0.9)",
  };

  ctx.filter = filters[filterType] || "none";
}
