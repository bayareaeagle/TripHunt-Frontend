import { cfAuthHeaders } from "./auth";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;

const STREAM_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;

interface DirectUploadResponse {
  uid: string;
  uploadURL: string;
}

interface StreamVideo {
  uid: string;
  readyToStream: boolean;
  thumbnail: string;
  playback: { hls: string; dash: string };
  status: { state: string };
  duration: number;
}

/** Request a direct-creator-upload URL from Cloudflare Stream. */
export async function createDirectUpload(
  maxDurationSeconds = 120,
  meta?: Record<string, string>,
): Promise<DirectUploadResponse> {
  const body: Record<string, unknown> = { maxDurationSeconds };
  if (meta) body.meta = meta;

  const res = await fetch(`${STREAM_BASE}/direct_upload`, {
    method: "POST",
    headers: {
      ...cfAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stream direct_upload error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.result as DirectUploadResponse;
}

/** Get video details from Stream. */
export async function getVideo(uid: string): Promise<StreamVideo> {
  const res = await fetch(`${STREAM_BASE}/${uid}`, {
    headers: cfAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stream get video error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.result as StreamVideo;
}

/** Get the thumbnail URL for a Stream video. */
export function streamThumbnailUrl(uid: string): string {
  return `https://customer-${ACCOUNT_ID}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`;
}

/** Get the HLS playback URL for a Stream video. */
export function streamPlaybackUrl(uid: string): string {
  return `https://customer-${ACCOUNT_ID}.cloudflarestream.com/${uid}/manifest/video.m3u8`;
}
