"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import type { UTxO } from "@meshsdk/core";
import { buildCastVoteTx } from "@/lib/cardano/transactions/cast-vote";
import { submitTx } from "@/lib/cardano/transactions/create-proposal";
import { findCollateralUtxo, mapTxError } from "@/lib/cardano/wallet-utils";

export type VoteTxStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export function useCastVote() {
  const { wallet, connected, address } = useWallet();
  const [status, setStatus] = useState<VoteTxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const castVote = useCallback(
    async (
      proposalTokenName: string,
      direction: "for" | "against",
      tallyTxHash: string,
      tallyOutputIndex: number,
    ) => {
      if (!connected || !wallet || !address) {
        setError("Wallet not connected");
        setStatus("error");
        return;
      }

      try {
        setStatus("building");
        setError(null);
        setTxHash(null);

        // Get wallet UTxOs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walletUtxos: UTxO[] = await (wallet as any).getUtxos();
        if (!walletUtxos || walletUtxos.length === 0) {
          throw new Error("No UTxOs found in wallet. You may need test ADA.");
        }

        // Find collateral
        const collateralUtxo = findCollateralUtxo(walletUtxos);
        if (!collateralUtxo) {
          throw new Error(
            "No suitable collateral UTxO found. Please set collateral in your wallet (a UTxO with at least 5 ADA and no other tokens).",
          );
        }

        // Build the vote transaction
        const unsignedTx = await buildCastVoteTx({
          walletAddress: address,
          walletUtxos,
          collateralUtxo,
          proposalTokenName,
          voteDirection: direction,
          tallyTxHash,
          tallyOutputIndex,
        });

        // Sign
        setStatus("signing");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signedTx = await (wallet as any).signTx(unsignedTx, true);

        // Submit
        setStatus("submitting");
        const hash = await submitTx(signedTx);

        setTxHash(hash);
        setStatus("success");
      } catch (err) {
        setError(mapTxError(err));
        setStatus("error");
      }
    },
    [connected, wallet, address],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return { status, txHash, error, castVote, reset };
}
