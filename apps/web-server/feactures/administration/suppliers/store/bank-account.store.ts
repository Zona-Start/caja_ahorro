import { create } from 'zustand';

interface Balances {
  totalBalanceBs: number;
  totalBalanceUsd: number;
  setTotalBalanceBs: (totalBalanceBs: number) => void;
  setTotalBalanceUsd: (totalBalanceUsd: number) => void;
}

export const useBankAccountStore = create<Balances>((set, get) => ({
  totalBalanceBs: 0,
  totalBalanceUsd: 0,
  setTotalBalanceBs: (totalBalanceBs) => set({ totalBalanceBs }),
  setTotalBalanceUsd: (totalBalanceUsd) => set({ totalBalanceUsd }),
}));
