import { create } from 'zustand';
import { type AssociatesLoan } from '../schemas/individual-load-api-schema';

interface LoansPaidState {
  selectedAssociate: AssociatesLoan | null;
  shouldClearSearch: boolean;
  loanSummary: {
    loanId: number;
    loanReference: string;
    totalAmount: string;
    pendingBalance: string;
    installmentsCount: number;
    paidInstallments: number;
    pendingInstallments: number;
  } | null;
  formValues: Record<string, unknown>;
  setSelectedAssociate: (associate: AssociatesLoan | null) => void;
  setShouldClearSearch: (clear: boolean) => void;
  setLoanSummary: (summary: LoansPaidState['loanSummary']) => void;
  setFormValues: (values: Record<string, unknown>) => void;
  clearAllLoanData: () => void;
}

const initialState = {
  selectedAssociate: null,
  loanSummary: null,
  formValues: {},
};

export const useLoansPaidStore = create<LoansPaidState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  loanSummary: initialState.loanSummary,
  setLoanSummary: (summary) => set({ loanSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  clearAllLoanData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      loanSummary: initialState.loanSummary,
      formValues: initialState.formValues,
      shouldClearSearch: true,
    }),
}));
