import { ENV } from "./_core/env";

/**
 * Helper to upload file to S3-compatible storage via Manus API
 */
export async function uploadToStorage(
  key: string,
  data: Buffer | Blob,
  contentType: string
): Promise<{ key: string; url: string }> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    throw new Error("Storage not configured");
  }

  try {
    // Get presigned upload URL
    const presignUrl = new URL(
      "v1/storage/presign/put",
      ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
    );
    presignUrl.searchParams.set("path", key);
    presignUrl.searchParams.set("contentType", contentType);

    const presignResp = await fetch(presignUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!presignResp.ok) {
      throw new Error(`Failed to get presigned URL: ${presignResp.status}`);
    }

    const { url: uploadUrl } = (await presignResp.json()) as { url: string };

    // Upload file to presigned URL
    let uploadBody: BodyInit;
    if (data instanceof Blob) {
      uploadBody = await data.arrayBuffer();
    } else if (Buffer.isBuffer(data)) {
      uploadBody = new Uint8Array(data);
    } else {
      uploadBody = data;
    }

    const uploadResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: uploadBody,
    });

    if (!uploadResp.ok) {
      throw new Error(`Upload failed: ${uploadResp.status}`);
    }

    // Return storage URL (will be served via /manus-storage proxy)
    const storageUrl = `/manus-storage/${encodeURIComponent(key)}`;

    return { key, url: storageUrl };
  } catch (error) {
    console.error("[Storage] Upload failed:", error);
    throw error;
  }
}

/**
 * Upload a photo to S3
 */
export async function uploadPhoto(
  userId: number,
  blob: Blob,
  filename: string
): Promise<{ key: string; url: string }> {
  const key = `photos/${userId}/${Date.now()}-${filename}`;
  return await uploadToStorage(key, blob, "image/jpeg");
}

/**
 * Upload a video to S3
 */
export async function uploadVideo(
  userId: number,
  blob: Blob,
  filename: string
): Promise<{ key: string; url: string }> {
  const key = `videos/${userId}/${Date.now()}-${filename}`;
  return await uploadToStorage(key, blob, "video/webm");
}

/**
 * Upload a background image to S3
 */
export async function uploadBackground(
  userId: number,
  blob: Blob,
  filename: string
): Promise<{ key: string; url: string }> {
  const key = `backgrounds/${userId}/${Date.now()}-${filename}`;
  return await uploadToStorage(key, blob, "image/jpeg");
}

/**
 * Upload a thumbnail to S3
 */
export async function uploadThumbnail(
  userId: number,
  blob: Blob,
  filename: string
): Promise<{ key: string; url: string }> {
  const key = `thumbnails/${userId}/${Date.now()}-${filename}`;
  return await uploadToStorage(key, blob, "image/jpeg");
}

/**
 * Get a storage URL for a key
 */
export function getStorageUrl(key: string): string {
  return `/manus-storage/${encodeURIComponent(key)}`;
}

/**
 * Generic storage put function for compatibility with existing code
 */
export async function storagePut(
  key: string,
  data: Buffer | Blob,
  contentType: string
): Promise<{ key: string; url: string }> {
  return await uploadToStorage(key, data, contentType);
}
