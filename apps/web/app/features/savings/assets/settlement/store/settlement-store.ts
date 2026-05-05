import { create } from 'zustand';

interface SettlementState {
  selectedAssociate: unknown | null;
  setSelectedAssociate: (associate: unknown | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  withdrawalSummary: {
    totalWithdrawal: string;
    totalPayable: string;
    installmentAmount: string;
  } | null;
  setWithdrawalSummary: (summary: SettlementState['withdrawalSummary']) => void;
  formValues: unknown;
  setFormValues: (values: unknown) => void;
  clearAllLoanData: () => void;
}

const initialState = {
  selectedAssociate: null,
  withdrawalSummary: null,
  formValues: {},
};

export const useSettlementStore = create<SettlementState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  withdrawalSummary: initialState.withdrawalSummary,
  setWithdrawalSummary: (summary) => set({ withdrawalSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  clearAllLoanData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      withdrawalSummary: initialState.withdrawalSummary,
      formValues: initialState.formValues,
      shouldClearSearch: true,
    }),
}));