import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createPresignedPutUrl } from "@/lib/cloudflare/r2";
import { d1Execute } from "@/lib/cloudflare/d1";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const { walletAddr, proposalId, contentType, fileSize } = await req.json();

    if (!walletAddr || !proposalId || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 400 });
    }

    const mediaId = uuidv4();
    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const r2Key = `proposals/${proposalId}/photos/${mediaId}.${ext}`;

    const uploadUrl = await createPresignedPutUrl(r2Key, contentType);

    await d1Execute(
      `INSERT INTO proposal_media (id, proposal_id, wallet_addr, media_type, r2_key, sort_order)
       VALUES (?, ?, ?, 'photo', ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM proposal_media WHERE proposal_id = ? AND media_type = 'photo'))`,
      [mediaId, proposalId, walletAddr, r2Key, proposalId],
    );

    return NextResponse.json({ uploadUrl, mediaId, r2Key });
  } catch (err) {
    console.error("photo/presign error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
