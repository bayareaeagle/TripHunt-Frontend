"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import type { UTxO } from "@meshsdk/core";
import { buildCountVotesTx } from "@/lib/cardano/transactions/count-votes";
import { submitTx } from "@/lib/cardano/transactions/create-proposal";
import { findCollateralUtxo, mapTxError } from "@/lib/cardano/wallet-utils";

export type CountVotesTxStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export function useCountVotes() {
  const { wallet, connected, address } = useWallet();
  const [status, setStatus] = useState<CountVotesTxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countVotes = useCallback(
    async (
      proposalTokenName: string,
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walletUtxos: UTxO[] = await (wallet as any).getUtxos();
        if (!walletUtxos || walletUtxos.length === 0) {
          throw new Error("No UTxOs found in wallet.");
        }

        const collateralUtxo = findCollateralUtxo(walletUtxos);
        if (!collateralUtxo) {
          throw new Error(
            "No suitable collateral UTxO found. Please set collateral in your wallet.",
          );
        }

        const unsignedTx = await buildCountVotesTx({
          walletAddress: address,
          walletUtxos,
          collateralUtxo,
          proposalTokenName,
          tallyTxHash,
          tallyOutputIndex,
        });

        setStatus("signing");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signedTx = await (wallet as any).signTx(unsignedTx, true);

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

  return { status, txHash, error, countVotes, reset };
}
