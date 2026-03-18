import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { d1Execute, d1Query } from "@/lib/cloudflare/d1";

interface ProposalRow {
  id: string;
  wallet_address: string;
  destination: string;
  departure_date: string;
  return_date: string;
  description: string;
  amount: number;
  currency: string;
  media_urls: string;
  status: string;
  created_at: string;
  tx_hash: string | null;
  votes_for: number;
  votes_against: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      destination,
      departureDate,
      returnDate,
      description,
      amount,
      currency,
      walletAddress,
      mediaUrls,
    } = body;

    // Validate required fields
    if (!destination || !departureDate || !returnDate || !description || !walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 },
      );
    }

    const id = uuidv4();
    const mediaUrlsJson = JSON.stringify(mediaUrls ?? []);

    await d1Execute(
      `INSERT INTO proposals (id, wallet_address, destination, departure_date, return_date, description, amount, currency, media_urls)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        walletAddress,
        destination,
        departureDate,
        returnDate,
        description,
        amount,
        currency ?? "ADA",
        mediaUrlsJson,
      ],
    );

    return NextResponse.json({ id, status: "pending" }, { status: 201 });
  } catch (err) {
    console.error("proposals POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const rows = await d1Query<ProposalRow>(
      `SELECT id, wallet_address, destination, departure_date, return_date,
              description, amount, currency, media_urls, status, created_at, tx_hash,
              votes_for, votes_against
       FROM proposals
       ORDER BY created_at DESC`,
    );

    const proposals = rows.map((row) => ({
      id: row.id,
      walletAddress: row.wallet_address,
      destination: row.destination,
      departureDate: row.departure_date,
      returnDate: row.return_date,
      description: row.description,
      amount: row.amount,
      currency: row.currency,
      mediaUrls: JSON.parse(row.media_urls || "[]"),
      status: row.status,
      createdAt: row.created_at,
      txHash: row.tx_hash,
      votesFor: row.votes_for ?? 0,
      votesAgainst: row.votes_against ?? 0,
    }));

    return NextResponse.json({ proposals });
  } catch (err) {
    console.error("proposals GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
