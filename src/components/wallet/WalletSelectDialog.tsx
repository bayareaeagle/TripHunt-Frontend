"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTripHuntWallet } from "@/hooks/useTripHuntWallet";
import { SUPPORTED_WALLETS } from "@/types/wallet";
import type { SupportedWallet } from "@/types/wallet";

interface WalletSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletSelectDialog({
  open,
  onOpenChange,
}: WalletSelectDialogProps) {
  const { connecting, error, connect, connected } = useTripHuntWallet();
  const [connectingWallet, setConnectingWallet] = useState<SupportedWallet | null>(null);

  const handleSelect = async (walletName: SupportedWallet) => {
    setConnectingWallet(walletName);
    try {
      await connect(walletName);
    } catch {
      // error is surfaced via the hook
    }
    setConnectingWallet(null);
  };

  // Close dialog when wallet connects successfully
  useEffect(() => {
    if (connected && open) {
      onOpenChange(false);
    }
  }, [connected, open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Select a Cardano wallet to connect to TripHunt. Your wallet will ask
            you to authorize this dApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {SUPPORTED_WALLETS.map((wallet) => {
            const isThisConnecting = connecting && connectingWallet === wallet.name;

            return (
              <button
                key={wallet.name}
                onClick={() => handleSelect(wallet.name)}
                disabled={connecting}
                className="flex w-full items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <Image
                  src={wallet.icon}
                  alt={wallet.label}
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-sm font-medium text-foreground">
                  {wallet.label}
                </span>
                {isThisConnecting && (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Approve in wallet...
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Don&apos;t have a wallet?{" "}
          <a
            href="https://eternl.io"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            Get Eternl
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
