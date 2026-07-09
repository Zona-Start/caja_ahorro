import { create } from 'zustand';
import type { AssociatesCredit } from '../schemas/individual-credits-api-schema';

interface CreditsPaidState {
  selectedAssociate: AssociatesCredit | null;
  setSelectedAssociate: (associate: AssociatesCredit | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  formValues: Record<string, unknown>;
  setFormValues: (values: Record<string, unknown>) => void;
  clearAllCreditData: () => void;
}

const initialState = {
  selectedAssociate: null as AssociatesCredit | null,
  formValues: {} as Record<string, unknown>,
};

export const useCreditsPaidStore = create<CreditsPaidState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  shouldClearSearch: false,
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  clearAllCreditData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      formValues: initialState.formValues,
      shouldClearSearch: true,
    }),
}));
