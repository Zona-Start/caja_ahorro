import { create } from 'zustand';
import type { AssociatesCredit } from '../schemas/individual-credits-api-schema';

interface CreditsPaidState {
  selectedAssociate: AssociatesCredit | null;
  setSelectedAssociate: (associate: AssociatesCredit | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  creditSummary: {
    totalQuota: string;
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
    totalPaid: string;
    outstandingBalance: string;
  } | null;
  setCreditSummary: (summary: CreditsPaidState['creditSummary']) => void;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
  clearAllCreditData: () => void;
}

const initialState = {
  selectedAssociate: null,
  creditSummary: null,
  formValues: {},
};

export const useCreditsPaidStore = create<CreditsPaidState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  creditSummary: initialState.creditSummary,
  setCreditSummary: (summary) => set({ creditSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  clearAllCreditData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      creditSummary: initialState.creditSummary,
      formValues: initialState.formValues,
      shouldClearSearch: true,
    }),
}));
