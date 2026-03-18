import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createDirectUpload } from "@/lib/cloudflare/stream";
import { d1Query, d1Execute } from "@/lib/cloudflare/d1";

interface MediaRow {
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddr, proposalId } = await req.json();

    if (!walletAddr || !proposalId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Remove any previous video records for this proposal (failed or stale uploads)
    await d1Execute(
      "DELETE FROM proposal_media WHERE proposal_id = ? AND media_type = 'video'",
      [proposalId],
    );

    const mediaId = uuidv4();
    const upload = await createDirectUpload(120, {
      proposalId,
      walletAddr,
      mediaId,
    });

    await d1Execute(
      `INSERT INTO proposal_media (id, proposal_id, wallet_addr, media_type, stream_uid)
       VALUES (?, ?, ?, 'video', ?)`,
      [mediaId, proposalId, walletAddr, upload.uid],
    );

    return NextResponse.json({
      uploadUrl: upload.uploadURL,
      streamUid: upload.uid,
      mediaId,
    });
  } catch (err) {
    console.error("video/create-upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
