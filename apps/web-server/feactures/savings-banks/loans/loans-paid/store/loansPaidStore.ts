import { create } from 'zustand';
import { AssociatesLoan } from '../schemas/individual-load-api-schema'; // Asegúrate que la ruta es correcta

interface LoansPaidState {
  selectedAssociate: AssociatesLoan | null;
  setSelectedAssociate: (associate: AssociatesLoan | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  loanSummary: {
    totalQuota: string;
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
  } | null;
  setLoanSummary: (summary: LoansPaidState['loanSummary']) => void;
  formValues: any; // Considera tipar esto de forma más específica si es posible
  setFormValues: (values: any) => void;
  // Nueva acción para limpiar los datos relacionados con el asociado y el préstamo
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

  shouldClearSearch: false, // Este flag se usa para comunicar al componente de búsqueda que limpie su input
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  loanSummary: initialState.loanSummary,
  setLoanSummary: (summary) => set({ loanSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  // Nueva acción implementada
  clearAllLoanData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      loanSummary: initialState.loanSummary,
      formValues: initialState.formValues,
      // Opcional: decidir si `clearAllLoanData` debe también activar `shouldClearSearch`.
      // Si la intención es que al limpiar los datos del préstamo también se limpie la UI de búsqueda,
      // entonces poner `shouldClearSearch: true` aquí tiene sentido.
      // El componente de búsqueda luego escucharía este cambio y actuaría (limpiando el input).
      shouldClearSearch: true,
    }),
}));
