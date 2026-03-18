import { NextRequest, NextResponse } from "next/server";
import { getVideo, streamPlaybackUrl } from "@/lib/cloudflare/stream";
import { moderateImageUrl } from "@/lib/cloudflare/workers-ai";
import { d1Query, d1Execute } from "@/lib/cloudflare/d1";

interface MediaRow {
  id: string;
  stream_uid: string;
  wallet_addr: string;
}

export async function POST(req: NextRequest) {
  try {
    const { mediaId, walletAddr } = await req.json();

    if (!mediaId || !walletAddr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await d1Query<MediaRow>(
      "SELECT id, stream_uid, wallet_addr FROM proposal_media WHERE id = ?",
      [mediaId],
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const media = rows[0];
    if (media.wallet_addr !== walletAddr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if Stream has finished processing
    let video;
    try {
      video = await getVideo(media.stream_uid);
    } catch (err) {
      // Stream API might not have the video yet right after upload
      console.warn("Stream getVideo error:", err instanceof Error ? err.message : err);
      return NextResponse.json({
        status: "processing",
        state: "uploading",
      });
    }

    if (!video.readyToStream) {
      return NextResponse.json({
        status: "processing",
        state: video.status.state,
      });
    }

    // Video is ready — auto-approve immediately
    const thumbnailUrl = video.thumbnail || null;
    const playbackUrl = streamPlaybackUrl(media.stream_uid);

    await d1Execute(
      "UPDATE proposal_media SET status = 'approved', updated_at = datetime('now') WHERE id = ?",
      [mediaId],
    );

    // Run moderation in background (don't block response)
    if (thumbnailUrl) {
      moderateImageUrl(thumbnailUrl)
        .then(async (moderation) => {
          if (!moderation.safe) {
            console.warn(`[TripHunt] Video ${mediaId} flagged by moderation — marking rejected`);
            await d1Execute(
              "UPDATE proposal_media SET status = 'rejected', updated_at = datetime('now') WHERE id = ?",
              [mediaId],
            );
          }
        })
        .catch((err) => {
          console.error("Background video moderation error:", err);
        });
    }

    return NextResponse.json({
      status: "approved",
      thumbnailUrl,
      playbackUrl,
    });
  } catch (err) {
    console.error("video/confirm error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
