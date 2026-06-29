import { create } from 'zustand';

interface WithdrawalState {
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
}

export const useWithdrawalStore = create<WithdrawalState>((set) => ({
  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),
}));
