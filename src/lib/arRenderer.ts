import { detectFace, segmentFrame, LANDMARKS, type FaceLandmarks } from "./arEngine";

export type ARMode = "none" | "dogEars" | "beauty" | "greenScreen";

interface RenderOptions {
  mode: ARMode;
  backgroundImage?: HTMLImageElement | null;
}

/** Draw dog ears + nose overlay positioned using face landmarks. */
function drawDogEars(ctx: CanvasRenderingContext2D, landmarks: FaceLandmarks, width: number, height: number) {
  const pts = landmarks.points;
  const forehead = pts[LANDMARKS.FOREHEAD_TOP];
  const leftTemple = pts[LANDMARKS.LEFT_TEMPLE];
  const rightTemple = pts[LANDMARKS.RIGHT_TEMPLE];
  const nose = pts[LANDMARKS.NOSE_TIP];

  const faceWidth = Math.abs(rightTemple.x - leftTemple.x) * width;
  const earSize = faceWidth * 0.55;

  const fx = forehead.x * width;
  const fy = forehead.y * height;

  // Left ear
  ctx.save();
  ctx.translate(fx - faceWidth * 0.32, fy - earSize * 0.35);
  drawEarShape(ctx, earSize, "#3a2a1a", true);
  ctx.restore();

  // Right ear
  ctx.save();
  ctx.translate(fx + faceWidth * 0.32, fy - earSize * 0.35);
  drawEarShape(ctx, earSize, "#3a2a1a", false);
  ctx.restore();

  // Nose
  const nx = nose.x * width;
  const ny = nose.y * height;
  const noseSize = faceWidth * 0.12;
  ctx.save();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.ellipse(nx, ny, noseSize, noseSize * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEarShape(ctx: CanvasRenderingContext2D, size: number, color: string, flip: boolean) {
  const s = flip ? -1 : 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * size * 0.5, -size * 0.9, s * size * 0.15, -size * 1.1);
  ctx.quadraticCurveTo(s * -size * 0.25, -size * 0.6, 0, 0);
  ctx.fill();

  // Inner ear
  ctx.fillStyle = "#c98a6b";
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.1);
  ctx.quadraticCurveTo(s * size * 0.3, -size * 0.6, s * size * 0.12, -size * 0.85);
  ctx.quadraticCurveTo(s * -size * 0.1, -size * 0.45, 0, -size * 0.1);
  ctx.fill();
}

/** Apply a soft blur specifically over the detected face region for a beauty-smoothing effect. */
function drawBeautySmoothing(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  landmarks: FaceLandmarks,
  width: number,
  height: number
) {
  const pts = landmarks.points;
  const faceOvalPoints = LANDMARKS.FACE_OVAL.map((i) => ({
    x: pts[i].x * width,
    y: pts[i].y * height,
  }));

  ctx.save();
  ctx.beginPath();
  faceOvalPoints.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.clip();

  ctx.filter = "blur(4px) brightness(1.05) contrast(0.95)";
  ctx.drawImage(video, 0, 0, width, height);
  ctx.filter = "none";
  ctx.restore();
}

/** Composite the person over a chosen background using the segmentation mask. */
function drawGreenScreen(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  mask: Uint8Array | null,
  width: number,
  height: number,
  backgroundImage?: HTMLImageElement | null
) {
  if (!mask) {
    ctx.drawImage(video, 0, 0, width, height);
    return;
  }

  if (backgroundImage) {
    ctx.drawImage(backgroundImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, width, height);
  }

  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = width;
  frameCanvas.height = height;
  const frameCtx = frameCanvas.getContext("2d")!;
  frameCtx.drawImage(video, 0, 0, width, height);
  const frameData = frameCtx.getImageData(0, 0, width, height);

  const maskWidth = Math.sqrt((mask.length * width) / height) | 0 || width;

  const outputData = ctx.getImageData(0, 0, width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const maskIdx = Math.floor((y / height) * height) * width + Math.floor((x / width) * width);
      const isPerson = mask[maskIdx] === 0; // category 0 = person in selfie segmenter
      if (isPerson) {
        const pixelIdx = (y * width + x) * 4;
        outputData.data[pixelIdx] = frameData.data[pixelIdx];
        outputData.data[pixelIdx + 1] = frameData.data[pixelIdx + 1];
        outputData.data[pixelIdx + 2] = frameData.data[pixelIdx + 2];
        outputData.data[pixelIdx + 3] = 255;
      }
    }
  }
  ctx.putImageData(outputData, 0, 0);
}

/** Main render loop step — call this every animation frame. */
export function renderARFrame(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  options: RenderOptions,
  timestampMs: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = canvas.width;
  const height = canvas.height;

  if (options.mode === "none") {
    ctx.drawImage(video, 0, 0, width, height);
    return;
  }

  if (options.mode === "greenScreen") {
    const mask = segmentFrame(video, timestampMs);
    drawGreenScreen(ctx, video, mask, width, height, options.backgroundImage);
    return;
  }

  // Face-based modes (dogEars, beauty) always draw the base video first
  ctx.drawImage(video, 0, 0, width, height);
  const face = detectFace(video, timestampMs);

  if (!face) return; // Graceful fallback — plain camera if no face detected

  if (options.mode === "beauty") {
    drawBeautySmoothing(ctx, video, face, width, height);
  } else if (options.mode === "dogEars") {
    drawBeautySmoothing(ctx, video, face, width, height);
    drawDogEars(ctx, face, width, height);
  }
}
