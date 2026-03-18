import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { d1Execute, d1Query } from "@/lib/cloudflare/d1";

interface VoteRow {
  id: string;
  direction: string;
}

export async function POST(req: NextRequest) {
  try {
    const { proposalId, walletAddress, direction } = await req.json();

    if (!proposalId || !walletAddress || !direction) {
      return NextResponse.json(
        { error: "Missing required fields (proposalId, walletAddress, direction)" },
        { status: 400 },
      );
    }

    if (direction !== "for" && direction !== "against") {
      return NextResponse.json(
        { error: "Direction must be 'for' or 'against'" },
        { status: 400 },
      );
    }

    // Check if user already voted on this proposal
    const existing = await d1Query<VoteRow>(
      "SELECT id, direction FROM proposal_votes WHERE proposal_id = ? AND wallet_address = ?",
      [proposalId, walletAddress],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You have already voted on this proposal", existingVote: existing[0].direction },
        { status: 409 },
      );
    }

    // Insert vote
    const voteId = uuidv4();
    await d1Execute(
      "INSERT INTO proposal_votes (id, proposal_id, wallet_address, direction) VALUES (?, ?, ?, ?)",
      [voteId, proposalId, walletAddress, direction],
    );

    // Update cached vote counts on the proposal
    const column = direction === "for" ? "votes_for" : "votes_against";
    await d1Execute(
      `UPDATE proposals SET ${column} = ${column} + 1 WHERE id = ?`,
      [proposalId],
    );

    return NextResponse.json({ voteId, direction }, { status: 201 });
  } catch (err) {
    console.error("proposals/vote POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

/** GET /api/proposals/vote?proposalId=X&walletAddress=Y — check if user voted */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const proposalId = searchParams.get("proposalId");
    const walletAddress = searchParams.get("walletAddress");

    if (!proposalId) {
      return NextResponse.json({ error: "Missing proposalId" }, { status: 400 });
    }

    // Get vote counts
    const counts = await d1Query<{ votes_for: number; votes_against: number }>(
      "SELECT votes_for, votes_against FROM proposals WHERE id = ?",
      [proposalId],
    );

    const votesFor = counts[0]?.votes_for ?? 0;
    const votesAgainst = counts[0]?.votes_against ?? 0;

    // Check user's vote if wallet provided
    let userVote: string | null = null;
    if (walletAddress) {
      const existing = await d1Query<VoteRow>(
        "SELECT id, direction FROM proposal_votes WHERE proposal_id = ? AND wallet_address = ?",
        [proposalId, walletAddress],
      );
      if (existing.length > 0) {
        userVote = existing[0].direction;
      }
    }

    return NextResponse.json({ votesFor, votesAgainst, userVote });
  } catch (err) {
    console.error("proposals/vote GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
