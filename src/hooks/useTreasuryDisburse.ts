"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import type { UTxO } from "@meshsdk/core";
import { buildDisburseTreasuryTx } from "@/lib/cardano/transactions/disburse-treasury";
import { submitTx } from "@/lib/cardano/transactions/create-proposal";
import {
  findCollateralUtxo,
  mapTxError,
  pkhToEnterpriseAddress,
} from "@/lib/cardano/wallet-utils";

export type DisburseTxStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export function useTreasuryDisburse() {
  const { wallet, connected, address } = useWallet();
  const [status, setStatus] = useState<DisburseTxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disburse = useCallback(
    async (
      tallyTxHash: string,
      tallyOutputIndex: number,
      travelerPkhOrAddress: string,
      disbursementLovelace: number,
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

        // If it looks like a pkh (56 hex chars), convert to enterprise address
        const travelerAddress =
          travelerPkhOrAddress.length === 56 &&
          /^[0-9a-fA-F]+$/.test(travelerPkhOrAddress)
            ? pkhToEnterpriseAddress(travelerPkhOrAddress)
            : travelerPkhOrAddress;

        const unsignedTx = await buildDisburseTreasuryTx({
          walletAddress: address,
          walletUtxos,
          collateralUtxo,
          tallyTxHash,
          tallyOutputIndex,
          travelerAddress,
          disbursementLovelace,
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

  return { status, txHash, error, disburse, reset };
}
