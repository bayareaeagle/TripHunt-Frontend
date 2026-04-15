import { getCloudflareContext } from "@opennextjs/cloudflare";

// Minimal R2Bucket shape used here — avoids pulling all of
// `@cloudflare/workers-types` just for this.
interface MinimalR2Object {
  arrayBuffer(): Promise<ArrayBuffer>;
}
interface MinimalR2Bucket {
  put(
    key: string,
    body: Uint8Array | ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<MinimalR2Object | null>;
  head(key: string): Promise<unknown | null>;
}

/**
 * R2 access via the Worker's `MEDIA_BUCKET` binding (declared in
 * wrangler.jsonc). This avoids needing R2 S3-compatible API tokens
 * (`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`), which the Cloudflare
 * Global API Key cannot mint.
 */
function bucket(): MinimalR2Bucket {
  const { env } = getCloudflareContext({ async: false }) as {
    env: { MEDIA_BUCKET?: MinimalR2Bucket };
  };
  if (!env.MEDIA_BUCKET) {
    throw new Error(
      "MEDIA_BUCKET binding not found. Check wrangler.jsonc r2_buckets entry.",
    );
  }
  return env.MEDIA_BUCKET;
}

/** Upload bytes to R2 server-side. */
export async function putObject(
  key: string,
  body: Uint8Array | ArrayBuffer,
  contentType: string,
): Promise<void> {
  await bucket().put(key, body, {
    httpMetadata: { contentType },
  });
}

/** Check if an object exists in R2. */
export async function headObject(key: string): Promise<boolean> {
  const head = await bucket().head(key);
  return head !== null;
}

/** Fetch object bytes from R2 (for server-side moderation). */
export async function getObjectBytes(key: string): Promise<Uint8Array> {
  const obj = await bucket().get(key);
  if (!obj) throw new Error(`R2 object not found: ${key}`);
  return new Uint8Array(await obj.arrayBuffer());
}

/** Build the public URL for an R2 object. */
export function r2PublicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) throw new Error("NEXT_PUBLIC_R2_PUBLIC_URL not set");
  return `${base.replace(/\/$/, "")}/${key}`;
}
