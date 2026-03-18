"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import type { UTxO } from "@meshsdk/core";
import {
  deserializeTxUnspentOutput,
  fromTxUnspentOutput,
} from "@meshsdk/core-cst";
import {
  buildCreateProposalTx,
  submitTx,
} from "@/lib/cardano/transactions/create-proposal";
import {
  PLATFORM_FEE_PERCENT,
  PLATFORM_FEE_ADDRESS,
  NETWORK,
} from "@/lib/cardano/constants";
import { findCollateralUtxo, mapTxError } from "@/lib/cardano/wallet-utils";

export type ProposalStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export interface TripFormData {
  destination: string;
  departureDate: string;
  returnDate: string;
  description: string;
  /** Trip cost in the selected currency's base unit (e.g. ADA, not lovelace) */
  amount: number;
  /** Currency symbol */
  currency: string;
}

/** Submit proposal to D1 API (used for non-mainnet / preprod testing). */
async function submitToD1(
  formData: TripFormData,
  walletAddress: string,
): Promise<string> {
  const res = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: formData.destination,
      departureDate: formData.departureDate,
      returnDate: formData.returnDate,
      description: formData.description,
      amount: formData.amount,
      currency: formData.currency,
      walletAddress,
      mediaUrls: [], // media is already stored via the media upload flow
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `API error ${res.status}`);
  }

  const { id } = await res.json();
  return id; // proposal UUID acts as a mock tx hash
}

export function useCreateProposal() {
  const { wallet, connected, address } = useWallet();
  const [status, setStatus] = useState<ProposalStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitProposal = useCallback(
    async (formData: TripFormData) => {
      if (!connected || !wallet || !address) {
        setError("Wallet not connected");
        setStatus("error");
        return;
      }

      try {
        setStatus("building");
        setError(null);
        setTxHash(null);

        // ── Non-mainnet: store in D1 instead of building Plutus tx ──
        if (NETWORK !== "mainnet") {
          console.log(
            `[TripHunt] Network is "${NETWORK}" — submitting proposal to D1 API`,
          );

          setStatus("submitting");
          const proposalId = await submitToD1(formData, address);

          setTxHash(proposalId);
          setStatus("success");
          return;
        }

        // ── Mainnet: build and submit Plutus transaction on-chain ──
        if (!PLATFORM_FEE_ADDRESS) {
          setError("Platform fee address not configured. Contact the site owner.");
          setStatus("error");
          return;
        }

        // Convert amount to lovelace (all supported currencies use 6 decimals)
        const costLovelace = Math.round(formData.amount * 1_000_000);
        const feeLovelace = Math.round(
          costLovelace * (PLATFORM_FEE_PERCENT / 100),
        );

        // Proposal voting period: 7 days from now
        const proposalEndTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

        // Get wallet UTxOs for coin selection
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawUtxos = await (wallet as any).getUtxos();
        if (!rawUtxos || rawUtxos.length === 0) {
          throw new Error("No UTxOs found in wallet. You may need test ADA.");
        }

        // CIP-30 wallets may return CBOR hex strings or parsed objects.
        // MeshSDK v2 BrowserWallet.getUtxos() should parse them, but
        // some wallets/versions return raw CBOR hex. Handle both.
        let walletUtxos: UTxO[];
        if (typeof rawUtxos[0] === "string") {
          // Raw CBOR hex from CIP-30 — deserialize manually
          console.log("[TripHunt] Deserializing CBOR UTxOs from wallet...");
          walletUtxos = rawUtxos.map((hex: string) =>
            fromTxUnspentOutput(deserializeTxUnspentOutput(hex)),
          );
        } else if (rawUtxos[0]?.output?.amount) {
          // Already parsed UTxO objects
          walletUtxos = rawUtxos;
        } else {
          throw new Error(
            "Wallet UTxO format unexpected. Try disconnecting and reconnecting your wallet.",
          );
        }

        if (walletUtxos.length === 0) {
          throw new Error("No UTxOs found in wallet after parsing.");
        }
        console.log(`[TripHunt] Parsed ${walletUtxos.length} UTxOs from wallet`);

        // Find a suitable collateral UTxO (pure ADA, at least 5 ADA)
        const collateralUtxo = findCollateralUtxo(walletUtxos);
        if (!collateralUtxo) {
          throw new Error(
            "No suitable collateral UTxO found. Please set collateral in your wallet (a UTxO with at least 5 ADA and no other tokens).",
          );
        }

        // Build the transaction
        const unsignedTx = await buildCreateProposalTx({
          walletAddress: address,
          walletUtxos,
          agentAddress: address, // For now, agent = traveler
          travelerAddress: address,
          totalCostLovelace: costLovelace,
          proposalEndTimePosix: proposalEndTime,
          feeLovelace,
          feeAddress: PLATFORM_FEE_ADDRESS,
          collateralUtxo,
        });

        // Sign the transaction
        setStatus("signing");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signedTx = await (wallet as any).signTx(unsignedTx, true);

        // Submit the transaction
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

  return { status, txHash, error, submitProposal, reset };
}
