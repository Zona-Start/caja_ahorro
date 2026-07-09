import { create } from 'zustand';
import type { AssociatesLoan } from '../schemas/individual-load-api-schema';

interface LoansPaidState {
  selectedAssociate: AssociatesLoan | null;
  setSelectedAssociate: (associate: AssociatesLoan | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
  clearAllLoanData: () => void;
}

const initialState = {
  selectedAssociate: null as AssociatesLoan | null,
  formValues: {} as Record<string, unknown>,
};

export const useLoansPaidStore = create<LoansPaidState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  clearAllLoanData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      formValues: initialState.formValues,
      shouldClearSearch: true,
    }),
}));
