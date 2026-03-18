"use client";

import { ThumbsUp, ThumbsDown, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NFTGate } from "@/components/wallet/NFTGate";
import { useCastVote } from "@/hooks/useCastVote";
import { NETWORK } from "@/lib/cardano/constants";

interface VotePanelProps {
  /** On-chain props — required for casting votes, optional for read-only display */
  proposalTokenName?: string;
  tallyTxHash?: string;
  tallyOutputIndex?: number;
  votesFor: number;
  votesAgainst: number;
  hasVoted?: boolean;
  status: string;
  /** Legacy prop for trip detail page compatibility */
  tripId?: string;
}

const explorerBase =
  NETWORK === "mainnet"
    ? "https://cardanoscan.io/transaction/"
    : "https://preprod.cardanoscan.io/transaction/";

export function VotePanel({
  proposalTokenName,
  tallyTxHash,
  tallyOutputIndex,
  votesFor,
  votesAgainst,
  hasVoted,
  status: proposalStatus,
}: VotePanelProps) {
  const totalVotes = votesFor + votesAgainst;
  const forPercent = totalVotes > 0 ? Math.round((votesFor / totalVotes) * 100) : 0;
  const isActive = proposalStatus === "active";
  const canVoteOnChain = !!(proposalTokenName && tallyTxHash !== undefined && tallyOutputIndex !== undefined);

  const { status: txStatus, txHash, error, castVote, reset } = useCastVote();
  const isBusy = txStatus === "building" || txStatus === "signing" || txStatus === "submitting";

  const handleVote = (direction: "for" | "against") => {
    if (!canVoteOnChain) return;
    castVote(proposalTokenName!, direction, tallyTxHash!, tallyOutputIndex!);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">Community Vote</h3>

      {/* Vote bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-emerald-600">
            For: {votesFor} ({forPercent}%)
          </span>
          <span className="font-medium text-rose-500">
            Against: {votesAgainst} ({100 - forPercent}%)
          </span>
        </div>
        <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="bg-rose-400 transition-all duration-500"
            style={{ width: `${100 - forPercent}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {totalVotes} total votes
        </p>
      </div>

      {/* Vote buttons / status */}
      {isActive && canVoteOnChain ? (
        <NFTGate>
          {txStatus === "success" ? (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" />
                Vote submitted!
              </div>
              {txHash && (
                <a
                  href={`${explorerBase}${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                >
                  View on CardanoScan
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ) : txStatus === "error" ? (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={reset}
              >
                Try Again
              </Button>
            </div>
          ) : hasVoted ? (
            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-sm font-medium text-foreground">
              <Check className="h-4 w-4 text-emerald-600" />
              You already voted on this proposal
            </div>
          ) : (
            <div className="mt-6 flex gap-3">
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleVote("for")}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="h-4 w-4" />
                )}
                {txStatus === "building"
                  ? "Building..."
                  : txStatus === "signing"
                    ? "Sign in wallet"
                    : txStatus === "submitting"
                      ? "Submitting..."
                      : "Vote For"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                onClick={() => handleVote("against")}
                disabled={isBusy}
              >
                {isBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsDown className="h-4 w-4" />
                )}
                Vote Against
              </Button>
            </div>
          )}
        </NFTGate>
      ) : !isActive ? (
        <div className="mt-6 rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
          Voting has ended for this proposal
        </div>
      ) : null}
    </div>
  );
}
