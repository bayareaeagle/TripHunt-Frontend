import { NextRequest, NextResponse } from "next/server";
import { d1Query } from "@/lib/cloudflare/d1";
import { r2PublicUrl } from "@/lib/cloudflare/r2";
import { streamThumbnailUrl, streamPlaybackUrl } from "@/lib/cloudflare/stream";

interface MediaRow {
  id: string;
  media_type: "photo" | "video";
  r2_key: string | null;
  stream_uid: string | null;
  status: string;
  sort_order: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proposalId: string }> },
) {
  try {
    const { proposalId } = await params;

    const rows = await d1Query<MediaRow>(
      `SELECT id, media_type, r2_key, stream_uid, status, sort_order
       FROM proposal_media
       WHERE proposal_id = ? AND status = 'approved'
       ORDER BY media_type, sort_order`,
      [proposalId],
    );

    const photos = rows
      .filter((r) => r.media_type === "photo" && r.r2_key)
      .map((r) => ({
        id: r.id,
        url: r2PublicUrl(r.r2_key!),
        sortOrder: r.sort_order,
      }));

    const videoRow = rows.find((r) => r.media_type === "video" && r.stream_uid);
    const video = videoRow
      ? {
          id: videoRow.id,
          thumbnailUrl: streamThumbnailUrl(videoRow.stream_uid!),
          playbackUrl: streamPlaybackUrl(videoRow.stream_uid!),
        }
      : null;

    return NextResponse.json({ photos, video });
  } catch (err) {
    console.error("media/[proposalId] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
