"use client";

import { useState } from "react";
import {
  Calculator,
  XCircle,
  Banknote,
  Loader2,
  Check,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCountVotes } from "@/hooks/useCountVotes";
import { useCancelVote } from "@/hooks/useCancelVote";
import { useTreasuryDisburse } from "@/hooks/useTreasuryDisburse";
import { NETWORK } from "@/lib/cardano/constants";
import type { UserVoteUtxo } from "@/lib/cardano/queries/fetch-proposals";

const explorerBase =
  NETWORK === "mainnet"
    ? "https://cardanoscan.io/transaction/"
    : "https://preprod.cardanoscan.io/transaction/";

interface ProposalActionsProps {
  proposalTokenName: string;
  tallyTxHash: string;
  tallyOutputIndex: number;
  isActive: boolean;
  votesFor: number;
  votesAgainst: number;
  pendingVoteCount: number;
  /** User's vote UTxO for this proposal, if any */
  userVote?: UserVoteUtxo;
  /** Traveler pkh or bech32 address for treasury disbursement */
  travelerPkhOrAddress?: string;
  /** Total cost in lovelace for treasury disbursement */
  totalCostLovelace?: number;
  /** Callback to refresh proposal data after an action */
  onActionComplete?: () => void;
}

type ActiveAction = "count" | "cancel" | "disburse" | null;

/**
 * Action buttons for a proposal: Count Votes, Cancel Vote, Disburse Treasury.
 * Renders below the VotePanel on the vote page.
 */
export function ProposalActions({
  proposalTokenName,
  tallyTxHash,
  tallyOutputIndex,
  isActive,
  votesFor,
  votesAgainst,
  pendingVoteCount,
  userVote,
  travelerPkhOrAddress,
  totalCostLovelace,
  onActionComplete,
}: ProposalActionsProps) {
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);

  const countVotesHook = useCountVotes();
  const cancelVoteHook = useCancelVote();
  const disburseHook = useTreasuryDisburse();

  const hasPassed = votesFor > votesAgainst && votesFor > 0;
  const canDisburse = !isActive && hasPassed && travelerPkhOrAddress && totalCostLovelace;

  // Determine which hook is currently active
  const currentHook =
    activeAction === "count"
      ? countVotesHook
      : activeAction === "cancel"
        ? cancelVoteHook
        : activeAction === "disburse"
          ? disburseHook
          : null;

  const isBusy =
    currentHook?.status === "building" ||
    currentHook?.status === "signing" ||
    currentHook?.status === "submitting";

  const handleCount = () => {
    setActiveAction("count");
    countVotesHook.countVotes(proposalTokenName, tallyTxHash, tallyOutputIndex);
  };

  const handleCancel = () => {
    if (!userVote) return;
    setActiveAction("cancel");
    cancelVoteHook.cancelVote(
      proposalTokenName,
      userVote.txHash,
      userVote.outputIndex,
    );
  };

  const handleDisburse = () => {
    if (!travelerPkhOrAddress || !totalCostLovelace) return;
    setActiveAction("disburse");
    disburseHook.disburse(
      tallyTxHash,
      tallyOutputIndex,
      travelerPkhOrAddress,
      totalCostLovelace,
    );
  };

  const handleReset = () => {
    currentHook?.reset();
    setActiveAction(null);
    onActionComplete?.();
  };

  // Show tx status if an action is in progress or completed
  if (currentHook && currentHook.status !== "idle") {
    return (
      <div className="mt-3 space-y-2">
        {currentHook.status === "success" ? (
          <>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
              <Check className="h-4 w-4" />
              {activeAction === "count"
                ? "Votes counted!"
                : activeAction === "cancel"
                  ? "Vote cancelled!"
                  : "Funds disbursed!"}
            </div>
            {currentHook.txHash && (
              <a
                href={`${explorerBase}${currentHook.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
              >
                View on CardanoScan
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleReset}
            >
              Done
            </Button>
          </>
        ) : currentHook.status === "error" ? (
          <>
            <div className="flex items-center justify-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {currentHook.error}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleReset}
            >
              Dismiss
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {currentHook.status === "building"
              ? "Building transaction..."
              : currentHook.status === "signing"
                ? "Sign in your wallet..."
                : "Submitting..."}
          </div>
        )}
      </div>
    );
  }

  // Show available actions
  const actions = [];

  // Count votes — available when there are uncounted votes
  if (pendingVoteCount > 0) {
    actions.push(
      <Button
        key="count"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs"
        onClick={handleCount}
        disabled={isBusy}
      >
        <Calculator className="h-3.5 w-3.5" />
        Count Votes ({pendingVoteCount})
      </Button>,
    );
  }

  // Cancel vote — available when user has a vote and voting is still active
  if (userVote && isActive) {
    actions.push(
      <Button
        key="cancel"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
        onClick={handleCancel}
        disabled={isBusy}
      >
        <XCircle className="h-3.5 w-3.5" />
        Cancel My Vote
      </Button>,
    );
  }

  // Disburse — available when proposal has ended and passed
  if (canDisburse) {
    actions.push(
      <Button
        key="disburse"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs text-amber-700 border-amber-200 hover:bg-amber-50"
        onClick={handleDisburse}
        disabled={isBusy}
      >
        <Banknote className="h-3.5 w-3.5" />
        Disburse Funds
      </Button>,
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions}
    </div>
  );
}
