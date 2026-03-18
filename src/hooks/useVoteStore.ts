import { create } from "zustand";

type VoteDirection = "for" | "against";

interface VoteState {
  votes: Record<string, VoteDirection>;
  castVote: (tripId: string, direction: VoteDirection) => void;
  getVote: (tripId: string) => VoteDirection | null;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  votes: {},

  castVote: (tripId, direction) => {
    set((state) => ({
      votes: { ...state.votes, [tripId]: direction },
    }));
  },

  getVote: (tripId) => {
    return get().votes[tripId] ?? null;
  },
}));
