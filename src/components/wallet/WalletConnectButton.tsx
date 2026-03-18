"use client";

import { useState } from "react";
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletSelectDialog } from "./WalletSelectDialog";
import { useTripHuntWallet } from "@/hooks/useTripHuntWallet";
import { formatAddress } from "@/lib/cardano/wallet-utils";

export function WalletConnectButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { connected, address, disconnect } = useTripHuntWallet();

  if (connected && address) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="hidden items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-1.5 text-sm font-medium text-foreground sm:flex">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          {formatAddress(address)}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={disconnect}
          title="Disconnect wallet"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setDialogOpen(true)}
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect Wallet
      </Button>
      <WalletSelectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
