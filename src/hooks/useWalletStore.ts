import { create } from "zustand";

/** Zustand store for NFT membership state (separate from Mesh's wallet context) */
interface NFTState {
  hasNFT: boolean;
  checkingNFT: boolean;
  setHasNFT: (has: boolean) => void;
  setCheckingNFT: (checking: boolean) => void;
  reset: () => void;
}

export const useNFTStore = create<NFTState>((set) => ({
  hasNFT: false,
  checkingNFT: false,
  setHasNFT: (has) => set({ hasNFT: has }),
  setCheckingNFT: (checking) => set({ checkingNFT: checking }),
  reset: () => set({ hasNFT: false, checkingNFT: false }),
}));
