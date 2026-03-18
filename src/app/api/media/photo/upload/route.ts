import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { putObject, r2PublicUrl } from "@/lib/cloudflare/r2";
import { moderateImage } from "@/lib/cloudflare/workers-ai";
import { d1Execute } from "@/lib/cloudflare/d1";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const walletAddr = formData.get("walletAddr") as string | null;
    const proposalId = formData.get("proposalId") as string | null;

    if (!file || !walletAddr || !proposalId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max 10 MB." }, { status: 400 });
    }

    const mediaId = uuidv4();
    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const r2Key = `proposals/${proposalId}/photos/${mediaId}.${ext}`;

    // Read file bytes
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Upload to R2 server-side (no CORS needed)
    await putObject(r2Key, bytes, file.type);

    // Insert D1 record — auto-approve immediately for fast UX
    await d1Execute(
      `INSERT INTO proposal_media (id, proposal_id, wallet_addr, media_type, r2_key, status, sort_order)
       VALUES (?, ?, ?, 'photo', ?, 'approved', (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM proposal_media WHERE proposal_id = ? AND media_type = 'photo'))`,
      [mediaId, proposalId, walletAddr, r2Key, proposalId],
    );

    const thumbnailUrl = r2PublicUrl(r2Key);

    // Run content moderation in background (don't block the response)
    moderateImage(bytes)
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
        // Moderation failure is non-fatal — photo stays approved
        console.error("Background moderation error:", err);
      });

    return NextResponse.json({
      mediaId,
      r2Key,
      status: "approved",
      thumbnailUrl,
    });
  } catch (err) {
    console.error("photo/upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
