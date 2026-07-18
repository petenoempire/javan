// Loads Google's MediaPipe Tasks Vision library directly from CDN at runtime.
// This avoids adding it as an npm dependency, which keeps our build stable.

let visionModule: any = null;
let faceLandmarker: any = null;
let imageSegmenter: any = null;

async function loadVisionModule() {
  if (visionModule) return visionModule;
  visionModule = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
  );
  return visionModule;
}

export async function initFaceLandmarker() {
  if (faceLandmarker) return faceLandmarker;
  const vision = await loadVisionModule();
  const filesetResolver = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  faceLandmarker = await vision.FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    outputFaceBlendshapes: false,
    runningMode: "VIDEO",
    numFaces: 1,
  });
  return faceLandmarker;
}

export async function initSegmenter() {
  if (imageSegmenter) return imageSegmenter;
  const vision = await loadVisionModule();
  const filesetResolver = await vision.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  imageSegmenter = await vision.ImageSegmenter.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });
  return imageSegmenter;
}

export interface FaceLandmarks {
  points: { x: number; y: number; z: number }[];
}

export function detectFace(video: HTMLVideoElement, timestampMs: number): FaceLandmarks | null {
  if (!faceLandmarker) return null;
  const result = faceLandmarker.detectForVideo(video, timestampMs);
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;
  return { points: result.faceLandmarks[0] };
}

export function segmentFrame(video: HTMLVideoElement, timestampMs: number): Uint8Array | null {
  if (!imageSegmenter) return null;
  let mask: Uint8Array | null = null;
  imageSegmenter.segmentForVideo(video, timestampMs, (result: any) => {
    const categoryMask = result.categoryMask;
    if (categoryMask) {
      mask = categoryMask.getAsUint8Array();
      categoryMask.close();
    }
  });
  return mask;
}

// Key landmark indices (MediaPipe Face Mesh, 478-point model)
export const LANDMARKS = {
  FOREHEAD_TOP: 10,
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
  NOSE_TIP: 1,
  CHIN: 152,
  LEFT_CHEEK: 50,
  RIGHT_CHEEK: 280,
  FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
};
