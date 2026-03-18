import { serializeAddressObj } from "@meshsdk/core";
import { pubKeyAddress } from "@meshsdk/common";
import type { UTxO } from "@meshsdk/core";
import { NETWORK } from "./constants";

/**
 * Check if any UTXO in the set contains a token under the given policy ID.
 * Uses the wallet's own UTXO set via CIP-30 — no Blockfrost needed.
 */
export function checkForNFT(utxos: UTxO[], policyId: string): boolean {
  for (const utxo of utxos) {
    for (const asset of utxo.output.amount) {
      if (asset.unit !== "lovelace" && asset.unit.startsWith(policyId)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Truncate a bech32 address for display: addr1q...x7f3
 */
export function formatAddress(bech32: string): string {
  if (bech32.length <= 15) return bech32;
  return `${bech32.slice(0, 8)}...${bech32.slice(-4)}`;
}

/**
 * Find a suitable collateral UTxO from the wallet.
 * Needs to be a pure ADA UTxO with at least 5 ADA.
 */
export function findCollateralUtxo(utxos: UTxO[]): UTxO | null {
  return (
    utxos.find((utxo) => {
      const isOnlyLovelace =
        utxo.output.amount.length === 1 &&
        utxo.output.amount[0].unit === "lovelace";
      const hasEnoughAda =
        isOnlyLovelace &&
        Number(utxo.output.amount[0].quantity) >= 5_000_000;
      return hasEnoughAda;
    }) ?? null
  );
}

/**
 * Map common transaction errors to user-friendly messages.
 */
export function mapTxError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("INPUTS_EXHAUSTED") || msg.includes("InputsExhaustedError"))
    return "Insufficient funds. You need more ADA in your wallet.";
  if (msg.includes("collateral"))
    return "Collateral issue. Please set collateral in your wallet settings.";
  if (
    msg.includes("user declined") ||
    msg.includes("User declined") ||
    msg.includes("rejected")
  )
    return "Transaction cancelled by user.";
  if (msg.includes("No Index UTxO") || msg.includes("No Configuration UTxO"))
    return msg;
  if (msg.includes("Network"))
    return "Network error. Please check your internet connection.";

  return msg;
}

/**
 * Build a bech32 enterprise address from a pub key hash.
 * Enterprise addresses have no staking credential.
 */
export function pkhToEnterpriseAddress(pkh: string): string {
  const networkId = NETWORK === "mainnet" ? 1 : 0;
  const addrObj = pubKeyAddress(pkh);
  return serializeAddressObj(addrObj, networkId);
}
