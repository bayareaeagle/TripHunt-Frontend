import { NextRequest, NextResponse } from "next/server";
import { headObject, getObjectBytes, r2PublicUrl } from "@/lib/cloudflare/r2";
import { moderateImage } from "@/lib/cloudflare/workers-ai";
import { d1Query, d1Execute } from "@/lib/cloudflare/d1";

interface MediaRow {
  id: string;
  r2_key: string;
  wallet_addr: string;
  status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { mediaId, walletAddr } = await req.json();

    if (!mediaId || !walletAddr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await d1Query<MediaRow>(
      "SELECT id, r2_key, wallet_addr, status FROM proposal_media WHERE id = ?",
      [mediaId],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const media = rows[0];
    if (media.wallet_addr !== walletAddr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the file landed in R2
    const exists = await headObject(media.r2_key!);
    if (!exists) {
      return NextResponse.json({ error: "Upload not found in storage" }, { status: 404 });
    }

    // Auto-approve immediately for fast UX
    await d1Execute(
      "UPDATE proposal_media SET status = 'approved', updated_at = datetime('now') WHERE id = ?",
      [mediaId],
    );

    const thumbnailUrl = r2PublicUrl(media.r2_key!);

    // Run content moderation in background (don't block the response)
    getObjectBytes(media.r2_key!)
      .then((imageBytes) => moderateImage(imageBytes))
      .then(async (moderation) => {
        if (!moderation.safe) {
          console.warn(`[TripHunt] Photo ${mediaId} flagged by moderation — marking rejected`);
          await d1Execute(
            "UPDATE proposal_media SET status = 'rejected', updated_at = datetime('now') WHERE id = ?",
            [mediaId],
          );
        }
      })
      .catch((err) => {
        console.error("Background moderation error:", err);
      });

    return NextResponse.json({
      status: "approved",
      thumbnailUrl,
    });
  } catch (err) {
    console.error("photo/confirm error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
