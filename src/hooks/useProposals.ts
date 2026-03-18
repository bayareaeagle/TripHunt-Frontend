"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchActiveProposals,
  type OnChainProposal,
} from "@/lib/cardano/queries/fetch-proposals";

const NETWORK = process.env.NEXT_PUBLIC_CARDANO_NETWORK || "mainnet";

/** D1-backed proposal shape (preprod/preview testing). */
export interface D1Proposal {
  id: string;
  walletAddress: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  description: string;
  amount: number;
  currency: string;
  mediaUrls: string[];
  status: string;
  createdAt: string;
  txHash: string | null;
  votesFor: number;
  votesAgainst: number;
}

/** Unified proposal type — either on-chain or D1. */
export type Proposal =
  | { source: "chain"; data: OnChainProposal }
  | { source: "d1"; data: D1Proposal };

async function fetchD1Proposals(): Promise<D1Proposal[]> {
  const res = await fetch("/api/proposals");
  if (!res.ok) throw new Error("Failed to fetch proposals from D1");
  const json = await res.json();
  return json.proposals ?? [];
}

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (NETWORK !== "mainnet") {
        // Preprod/preview: fetch from D1 database
        const d1Data = await fetchD1Proposals();
        setProposals(d1Data.map((d) => ({ source: "d1" as const, data: d })));
      } else {
        // Mainnet: fetch from blockchain
        const chainData = await fetchActiveProposals();
        setProposals(
          chainData.map((d) => ({ source: "chain" as const, data: d })),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch proposals",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { proposals, loading, error, refresh };
}
