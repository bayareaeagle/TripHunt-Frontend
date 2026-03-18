"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Wallet, Ticket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { WalletConnectButton } from "./WalletConnectButton";
import { useTripHuntWallet } from "@/hooks/useTripHuntWallet";

interface NFTGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function NFTGate({ children, fallback }: NFTGateProps) {
  const { connected, hasNFT } = useTripHuntWallet();

  if (connected && hasNFT) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!connected) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
        <Wallet className="mx-auto h-10 w-10 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Connect Your Wallet
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a Cardano wallet to access this feature.
        </p>
        <div className="mt-5 flex justify-center">
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  // connected but no NFT
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
      <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        TripHunt NFT Required
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        You need a TripHunt membership NFT to access this feature.
      </p>
      <Link
        href="/membership"
        className={buttonVariants({ size: "sm", variant: "outline", className: "mt-5" })}
      >
        Get a Membership NFT
      </Link>
    </div>
  );
}
