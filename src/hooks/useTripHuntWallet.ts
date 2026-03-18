"use client";

import { useEffect, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { useNFTStore } from "./useWalletStore";
import { MEMBERSHIP_POLICY_ID, NETWORK } from "@/lib/cardano/constants";

/**
 * Combined wallet hook that uses MeshSDK's built-in CIP-30 connect flow.
 * MeshSDK's connect() calls MeshCardanoBrowserWallet.enable(walletName)
 * which triggers the browser extension popup for user authorization.
 */
export function useTripHuntWallet() {
  const {
    connect: meshConnect,
    disconnect: meshDisconnect,
    connected,
    connecting,
    wallet,
    name,
    error,
    address,
  } = useWallet();

  const { hasNFT, checkingNFT, setHasNFT, setCheckingNFT, reset } =
    useNFTStore();

  // Check for membership NFT when wallet connects
  useEffect(() => {
    if (!connected || !wallet) {
      reset();
      return;
    }

    let cancelled = false;

    async function checkMembership() {
      setCheckingNFT(true);
      try {
        // Bypass NFT gate on preprod/preview for testing
        if (NETWORK !== "mainnet") {
          setHasNFT(true);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawUtxos = await (wallet as any).getUtxos();
        if (!cancelled && rawUtxos && Array.isArray(rawUtxos)) {
          const found = rawUtxos.some((utxo: unknown) => {
            if (typeof utxo === "string") {
              return utxo.includes(MEMBERSHIP_POLICY_ID);
            }
            const obj = utxo as { output?: { amount?: { unit?: string }[] } };
            return obj?.output?.amount?.some(
              (a) => a.unit && a.unit !== "lovelace" && a.unit.startsWith(MEMBERSHIP_POLICY_ID),
            );
          });
          setHasNFT(found);
        }
      } catch {
        if (!cancelled) setHasNFT(false);
      } finally {
        if (!cancelled) setCheckingNFT(false);
      }
    }

    checkMembership();
    return () => {
      cancelled = true;
    };
  }, [connected, wallet, setHasNFT, setCheckingNFT, reset]);

  // Use MeshSDK's built-in connect which properly calls
  // CIP-30 enable() via MeshCardanoBrowserWallet.enable()
  const connect = useCallback(
    async (walletName: string) => {
      console.log(`[TripHunt] Connecting to ${walletName} via MeshSDK CIP-30...`);
      await meshConnect(walletName);
      console.log(`[TripHunt] Wallet connected: ${walletName}`);
    },
    [meshConnect],
  );

  const disconnect = useCallback(() => {
    meshDisconnect();
    reset();
  }, [meshDisconnect, reset]);

  return {
    connected,
    connecting,
    address,
    walletName: name,
    error: error ? String(error) : null,
    hasNFT,
    checkingNFT,
    connect,
    disconnect,
  };
}
