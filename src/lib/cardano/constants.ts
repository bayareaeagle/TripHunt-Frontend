/** TripHunt membership NFT policy ID — used for token gating */
export const MEMBERSHIP_POLICY_ID =
  "c281975562f394761771f13f599881517fa8455946e7e30454de22da";

/** Cardano network — "mainnet" | "preprod" | "preview" */
export const NETWORK =
  (process.env.NEXT_PUBLIC_CARDANO_NETWORK as string) || "mainnet";

/** Supported payment currencies for trip funding */
export type PaymentCurrency = "ADA" | "USDM" | "USDCx";

export interface CurrencyInfo {
  symbol: PaymentCurrency;
  name: string;
  policyId: string | null; // null for ADA (native)
  hexName: string | null;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  {
    symbol: "ADA",
    name: "Cardano",
    policyId: null,
    hexName: null,
    decimals: 6,
  },
  {
    symbol: "USDM",
    name: "USDM (Moneta)",
    policyId: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",
    hexName: "0014df105553444d",
    decimals: 6,
  },
  {
    symbol: "USDCx",
    name: "USDCx (Circle)",
    policyId: "1f3aec8bfe7ea4fe14c5f121e2a92e301afe414147860d557cac7e34",
    hexName: null,
    decimals: 6,
  },
];

/** Platform fee — percentage taken from each trip submission */
export const PLATFORM_FEE_PERCENT = Number(
  process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ?? "3",
);

/** Cardano address that receives platform fees */
export const PLATFORM_FEE_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_FEE_ADDRESS ?? "";

/** Blockfrost API key for chain queries and tx submission */
export const BLOCKFROST_API_KEY =
  process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY ?? "";
