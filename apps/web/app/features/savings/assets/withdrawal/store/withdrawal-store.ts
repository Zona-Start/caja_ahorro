import { create } from 'zustand';
import { type AssociatesWithdrawal } from '../schemas/individual-withdrawal-api-schema';
import { type WithdrawalType } from '../schemas/withdrawal-api-response';

interface WithdrawalState {
  selectedAssociate: AssociatesWithdrawal | null;
  selectedWithdrawalType: WithdrawalType | null;
  enabledTime: boolean;
  setEnabledTime: (enabledTime: boolean) => void;
  setSelectedAssociate: (associate: AssociatesWithdrawal | null) => void;
  setSelectedWithdrawalType: (withdrawalType: WithdrawalType | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  withdrawalSummary: {
    totalWithdrawal: string;
    totalPayable: string;
    installmentAmount: string;
  } | null;
  setWithdrawalSummary: (summary: WithdrawalState['withdrawalSummary']) => void;
  formValues: any;
  setFormValues: (values: any) => void;
  clearAllWithdrawalData: () => void;
}

const initialState = {
  selectedAssociate: null,
  selectedWithdrawalType: null,
  withdrawalSummary: null,
  enabledTime: true,
  formValues: {},
};

export const useWithdrawalStore = create<WithdrawalState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  selectedWithdrawalType: initialState.selectedWithdrawalType,
  setSelectedWithdrawalType: (withdrawalType) =>
    set({ selectedWithdrawalType: withdrawalType }),

  enabledTime: initialState.enabledTime,
  setEnabledTime: (enabledTime) => set({ enabledTime: enabledTime }),

  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  withdrawalSummary: initialState.withdrawalSummary,
  setWithdrawalSummary: (summary) => set({ withdrawalSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  clearAllWithdrawalData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      selectedWithdrawalType: initialState.selectedWithdrawalType,
      withdrawalSummary: initialState.withdrawalSummary,
      formValues: initialState.formValues,
      enabledTime: initialState.enabledTime,
      shouldClearSearch: true,
    }),
}));
