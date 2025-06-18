import { create } from 'zustand';
import { AssociatesSettlement } from '../schemas/individual-settlement-api-schema'; // Asegúrate que la ruta es correcta

interface SettlementState {
  selectedAssociate: AssociatesSettlement | null;
  setSelectedAssociate: (associate: AssociatesSettlement | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  withdrawalSummary: {
    totalWithdrawal: string;
    totalPayable: string;
    installmentAmount: string;
  } | null;
  setWithdrawalSummary: (summary: SettlementState['withdrawalSummary']) => void;
  formValues: any; // Considera tipar esto de forma más específica si es posible
  setFormValues: (values: any) => void;
  // Nueva acción para limpiar los datos relacionados con el asociado y el préstamo
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

  shouldClearSearch: false, // Este flag se usa para comunicar al componente de búsqueda que limpie su input
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  withdrawalSummary: initialState.withdrawalSummary,
  setWithdrawalSummary: (summary) => set({ withdrawalSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  // Nueva acción implementada
  clearAllLoanData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      withdrawalSummary: initialState.withdrawalSummary,
      formValues: initialState.formValues,
      shouldClearSearch: true,
    }),
}));
