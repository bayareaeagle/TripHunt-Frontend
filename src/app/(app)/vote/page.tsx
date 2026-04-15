"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Check,
} from "lucide-react";
import { deserializeAddress } from "@meshsdk/core";
import { useTripHuntWallet } from "@/hooks/useTripHuntWallet";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { VotePanel } from "@/components/voting/VotePanel";
import { ProposalActions } from "@/components/voting/ProposalActions";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { useProposals, type D1Proposal } from "@/hooks/useProposals";
import {
  fetchUserVotes,
  countPendingVotes,
  type UserVoteUtxo,
} from "@/lib/cardano/queries/fetch-proposals";

const NETWORK = process.env.NEXT_PUBLIC_CARDANO_NETWORK || "mainnet";

/* ──────────────────────────────────────────────────────────────────── */
/*  D1 Proposal Card — interactive voting for preprod                 */
/* ──────────────────────────────────────────────────────────────────── */

function D1ProposalCard({
  proposal,
  walletAddress,
  onVoted,
}: {
  proposal: D1Proposal;
  walletAddress: string | null;
  onVoted: () => void;
}) {
  const [voting, setVoting] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [localFor, setLocalFor] = useState(proposal.votesFor);
  const [localAgainst, setLocalAgainst] = useState(proposal.votesAgainst);
  const [error, setError] = useState<string | null>(null);

  const totalVotes = localFor + localAgainst;
  const forPct = totalVotes > 0 ? Math.round((localFor / totalVotes) * 100) : 0;

  // Check if user already voted
  useEffect(() => {
    if (!walletAddress) return;
    fetch(
      `/api/proposals/vote?proposalId=${proposal.id}&walletAddress=${walletAddress}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setUserVote(data.userVote ?? null);
        setLocalFor(data.votesFor ?? proposal.votesFor);
        setLocalAgainst(data.votesAgainst ?? proposal.votesAgainst);
      })
      .catch(() => {});
  }, [proposal.id, walletAddress, proposal.votesFor, proposal.votesAgainst]);

  const castVote = async (direction: "for" | "against") => {
    // Hard gate: never send a vote to the API without a connected wallet.
    if (!walletAddress) {
      setError("Connect your wallet to vote.");
      return;
    }
    if (voting || userVote) return;
    setVoting(true);
    setError(null);
    try {
      const res = await fetch("/api/proposals/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: proposal.id,
          walletAddress,
          direction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setUserVote(data.existingVote);
        } else {
          throw new Error(data.error || "Vote failed");
        }
      } else {
        setUserVote(direction);
        if (direction === "for") setLocalFor((v) => v + 1);
        else setLocalAgainst((v) => v + 1);
        onVoted();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  const departureDate = new Date(proposal.departureDate);
  const returnDate = new Date(proposal.returnDate);
  const createdAt = new Date(proposal.createdAt);

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden">
      {/* Card body */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
            <h3 className="text-base font-semibold text-foreground">
              {proposal.destination}
            </h3>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
              proposal.status === "pending"
                ? "bg-amber-100 text-amber-700"
                : proposal.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {proposal.status}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-muted-foreground line-clamp-3">
          {proposal.description}
        </p>

        {/* Details */}
        <div className="space-y-1.5 text-sm mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {departureDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              –{" "}
              {returnDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span>
              {proposal.amount.toLocaleString()} {proposal.currency}
            </span>
          </div>
        </div>

        {/* Vote bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="text-emerald-600 font-medium">
              {localFor} For ({forPct}%)
            </span>
            <span className="text-red-500 font-medium">
              {localAgainst} Against ({totalVotes > 0 ? 100 - forPct : 0}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            {totalVotes > 0 ? (
              <div className="h-full flex">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${forPct}%` }}
                />
                <div
                  className="bg-red-400 transition-all duration-300"
                  style={{ width: `${100 - forPct}%` }}
                />
              </div>
            ) : (
              <div className="h-full bg-gray-200 rounded-full" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {totalVotes} total vote{totalVotes !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Vote buttons */}
        {walletAddress ? (
          userVote ? (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-3 text-sm">
              <Check className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">
                You voted{" "}
                <span className={userVote === "for" ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>
                  {userVote}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                onClick={() => castVote("for")}
                disabled={voting}
              >
                {voting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                Vote For
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                onClick={() => castVote("against")}
                disabled={voting}
              >
                {voting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                Vote Against
              </Button>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 py-3">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to vote
            </p>
            <WalletConnectButton />
          </div>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-slate-50/50 px-5 py-2.5">
        <span className="text-xs text-muted-foreground">
          {createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {proposal.id.slice(0, 8)}...
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Vote Page                                                          */
/* ──────────────────────────────────────────────────────────────────── */

export default function VotePage() {
  const { proposals, loading, error, refresh } = useProposals();
  const { connected, address } = useTripHuntWallet();

  // Track user votes and pending vote counts per proposal (on-chain only)
  const [userVotes, setUserVotes] = useState<Map<string, UserVoteUtxo>>(
    new Map(),
  );
  const [pendingCounts, setPendingCounts] = useState<Map<string, number>>(
    new Map(),
  );

  const chainProposals = proposals.filter((p) => p.source === "chain");
  const d1Proposals = proposals.filter((p) => p.source === "d1");

  const loadExtras = useCallback(async () => {
    if (chainProposals.length === 0) return;

    const counts = new Map<string, number>();
    for (const p of chainProposals) {
      try {
        const count = await countPendingVotes(p.data.tokenName);
        counts.set(p.data.tokenName, count);
      } catch {
        counts.set(p.data.tokenName, 0);
      }
    }
    setPendingCounts(counts);

    if (connected && address) {
      try {
        const { pubKeyHash } = deserializeAddress(address);
        const votes = await fetchUserVotes(pubKeyHash);
        const voteMap = new Map<string, UserVoteUtxo>();
        for (const v of votes) {
          voteMap.set(v.proposalTokenName, v);
        }
        setUserVotes(voteMap);
      } catch {
        setUserVotes(new Map());
      }
    }
  }, [chainProposals.length, connected, address]);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  return (
    <>
      {/* Header */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Vote on Proposals"
            subtitle="The health of our community depends on YOUR votes. Vote today and earn points towards rewards!"
          />
        </div>
      </section>

      {/* Vote Cards */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Refresh button */}
          <div className="mb-6 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>

          {/* Preprod notice */}
          {NETWORK !== "mainnet" && d1Proposals.length > 0 && (
            <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Showing {d1Proposals.length} proposal
              {d1Proposals.length !== 1 ? "s" : ""} (preprod mode — votes stored
              off-chain).
            </div>
          )}

          {/* Loading state */}
          {loading && proposals.length === 0 && (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Fetching proposals...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {/* D1 proposals grid (preprod) */}
          {d1Proposals.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {d1Proposals.map((p) => (
                <D1ProposalCard
                  key={p.data.id}
                  proposal={p.data}
                  walletAddress={connected && address ? address : null}
                  onVoted={refresh}
                />
              ))}
            </div>
          )}

          {/* On-chain proposals grid (mainnet) */}
          {chainProposals.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {chainProposals.map((p) => {
                const proposal = p.data;
                const isActive =
                  proposal.tallyState.proposalEndTimePosix > Date.now();

                return (
                  <div key={`${proposal.txHash}-${proposal.outputIndex}`}>
                    <div className="mb-3 space-y-1">
                      <h3 className="text-sm font-medium text-foreground">
                        Proposal #{proposal.tokenName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Cost:{" "}
                        {(
                          proposal.tallyState.proposal.totalCostLovelace /
                          1_000_000
                        ).toFixed(2)}{" "}
                        ADA
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ends:{" "}
                        {new Date(
                          proposal.tallyState.proposalEndTimePosix,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <VotePanel
                      proposalTokenName={proposal.tokenName}
                      tallyTxHash={proposal.txHash}
                      tallyOutputIndex={proposal.outputIndex}
                      votesFor={proposal.tallyState.votesFor}
                      votesAgainst={proposal.tallyState.votesAgainst}
                      hasVoted={userVotes.has(proposal.tokenName)}
                      status={isActive ? "active" : "ended"}
                    />
                    <ProposalActions
                      proposalTokenName={proposal.tokenName}
                      tallyTxHash={proposal.txHash}
                      tallyOutputIndex={proposal.outputIndex}
                      isActive={isActive}
                      votesFor={proposal.tallyState.votesFor}
                      votesAgainst={proposal.tallyState.votesAgainst}
                      pendingVoteCount={
                        pendingCounts.get(proposal.tokenName) ?? 0
                      }
                      userVote={userVotes.get(proposal.tokenName)}
                      travelerPkhOrAddress={
                        proposal.tallyState.proposal.travelerPkh
                      }
                      totalCostLovelace={
                        proposal.tallyState.proposal.totalCostLovelace
                      }
                      onActionComplete={refresh}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && proposals.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-muted-foreground">
                No active proposals to vote on right now.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Submit a travel request to create the first proposal!
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
