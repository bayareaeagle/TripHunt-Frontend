import { NextRequest, NextResponse } from "next/server";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

/**
 * Proxy video upload to Cloudflare Stream.
 * The browser can't upload directly due to CORS restrictions on Stream's
 * direct upload URLs, so we proxy through our own API route.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const streamUid = formData.get("streamUid") as string | null;
    const uploadUrl = formData.get("uploadUrl") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // If we have an uploadUrl from a direct_upload, use it
    if (uploadUrl) {
      const streamForm = new FormData();
      streamForm.append("file", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: streamForm,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Stream direct upload error:", res.status, text);
        return NextResponse.json(
          { error: `Stream upload failed: ${res.status}` },
          { status: 502 },
        );
      }

      return NextResponse.json({ success: true });
    }

    // Fallback: upload via Stream API directly (non-direct-upload path)
    if (!streamUid) {
      const streamForm = new FormData();
      streamForm.append("file", file);

      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${API_TOKEN}` },
          body: streamForm,
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Stream upload error:", res.status, text);
        return NextResponse.json(
          { error: `Stream upload failed: ${res.status}` },
          { status: 502 },
        );
      }

      const data = await res.json();
      return NextResponse.json({ success: true, uid: data.result?.uid });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (err) {
    console.error("video/upload proxy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

// Allow large video files (up to 200MB)
export const config = {
  api: {
    bodyParser: false,
  },
};
