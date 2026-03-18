const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

const AI_BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run`;
const NSFW_MODEL = "@cf/microsoft/resnet-50";

interface ClassificationResult {
  label: string;
  score: number;
}

/**
 * Run NSFW classification on image bytes.
 * Returns true if the image is safe, false if NSFW.
 * Gracefully falls back to "safe" if the AI API is unavailable.
 */
export async function moderateImage(imageBytes: Uint8Array): Promise<{
  safe: boolean;
  results: ClassificationResult[];
}> {
  try {
    const res = await fetch(`${AI_BASE}/${NSFW_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: imageBytes.buffer as ArrayBuffer,
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`Workers AI moderation unavailable (${res.status}): ${text}. Auto-approving.`);
      return { safe: true, results: [] };
    }

    const data = await res.json();
    const results: ClassificationResult[] = data.result ?? [];

    // Check if any NSFW-related label has a high score
    const nsfwLabels = ["nsfw", "porn", "sexy", "hentai"];
    const nsfwScore = results
      .filter((r) => nsfwLabels.some((l) => r.label.toLowerCase().includes(l)))
      .reduce((max, r) => Math.max(max, r.score), 0);

    return { safe: nsfwScore < 0.7, results };
  } catch (err) {
    console.warn("Workers AI moderation failed:", err instanceof Error ? err.message : err, ". Auto-approving.");
    return { safe: true, results: [] };
  }
}

/** Fetch image bytes from a URL and run moderation. */
export async function moderateImageUrl(url: string): Promise<{
  safe: boolean;
  results: ClassificationResult[];
}> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image for moderation: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  return moderateImage(bytes);
}
