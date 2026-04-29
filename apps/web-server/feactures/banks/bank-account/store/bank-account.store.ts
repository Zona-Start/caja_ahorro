import { create } from 'zustand';

interface Balances {
  totalBookBalanceBs: number;
  totalStatementBalanceBs: number;
  totalBookBalanceUsd: number;
  totalStatementBalanceUsd: number;
  setTotalBookBalanceBs: (total: number) => void;
  setTotalStatementBalanceBs: (total: number) => void;
  setTotalBookBalanceUsd: (total: number) => void;
  setTotalStatementBalanceUsd: (total: number) => void;
}

export const useBankAccountStore = create<Balances>((set) => ({
  totalBookBalanceBs: 0,
  totalStatementBalanceBs: 0,
  totalBookBalanceUsd: 0,
  totalStatementBalanceUsd: 0,
  setTotalBookBalanceBs: (totalBookBalanceBs) => set({ totalBookBalanceBs }),
  setTotalStatementBalanceBs: (totalStatementBalanceBs) =>
    set({ totalStatementBalanceBs }),
  setTotalBookBalanceUsd: (totalBookBalanceUsd) => set({ totalBookBalanceUsd }),
  setTotalStatementBalanceUsd: (totalStatementBalanceUsd) =>
    set({ totalStatementBalanceUsd }),
}));
