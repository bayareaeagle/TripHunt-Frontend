import { NextRequest, NextResponse } from "next/server";
import { d1Execute } from "@/lib/cloudflare/d1";

export async function POST(req: NextRequest) {
  try {
    const { tempProposalId, onChainProposalId, walletAddr } = await req.json();

    if (!tempProposalId || !onChainProposalId || !walletAddr) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { changes } = await d1Execute(
      `UPDATE proposal_media
       SET proposal_id = ?, updated_at = datetime('now')
       WHERE proposal_id = ? AND wallet_addr = ?`,
      [onChainProposalId, tempProposalId, walletAddr],
    );

    return NextResponse.json({ updated: changes });
  } catch (err) {
    console.error("media/finalize error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
