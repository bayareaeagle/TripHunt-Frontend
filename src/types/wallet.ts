export type SupportedWallet = "eternl" | "lace" | "vespr";

export interface WalletInfo {
  name: SupportedWallet;
  label: string;
  icon: string;
}

export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    name: "eternl",
    label: "Eternl",
    icon: "https://raw.githubusercontent.com/nicholasgasior/cardano-wallet-logos/main/eternl.png",
  },
  {
    name: "lace",
    label: "Lace",
    icon: "https://raw.githubusercontent.com/nicholasgasior/cardano-wallet-logos/main/lace.png",
  },
  {
    name: "vespr",
    label: "Vespr",
    icon: "https://raw.githubusercontent.com/nicholasgasior/cardano-wallet-logos/main/vespr.png",
  },
];

export interface WalletState {
  connected: boolean;
  walletName: SupportedWallet | null;
  address: string | null;
  hasNFT: boolean;
  connecting: boolean;
  error: string | null;
}
