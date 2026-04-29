import { create } from 'zustand';
import { AssociatesCredit } from '../schemas/individual-credits-api-schema'; // Asegúrate que la ruta es correcta

interface CreditPaidState {
  selectedAssociate: AssociatesCredit | null;
  setSelectedAssociate: (associate: AssociatesCredit | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  creditSummary: {
    totalQuota: string;
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
  } | null;
  setCreditSummary: (summary: CreditPaidState['creditSummary']) => void;
  formValues: any; // Considera tipar esto de forma más específica si es posible
  setFormValues: (values: any) => void;
  // Nueva acción para limpiar los datos relacionados con el asociado y el préstamo
  clearAllCreditData: () => void;
}

const initialState = {
  selectedAssociate: null,
  creditSummary: null,
  formValues: {},
};

export const useCreditPaidStore = create<CreditPaidState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  shouldClearSearch: false, // Este flag se usa para comunicar al componente de búsqueda que limpie su input
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),

  creditSummary: initialState.creditSummary,
  setCreditSummary: (summary) => set({ creditSummary: summary }),

  formValues: initialState.formValues,
  setFormValues: (values) => set({ formValues: values }),

  // Nueva acción implementada
  clearAllCreditData: () =>
    set({
      selectedAssociate: initialState.selectedAssociate,
      creditSummary: initialState.creditSummary,
      formValues: initialState.formValues,
      // Opcional: decidir si `clearAllLoanData` debe también activar `shouldClearSearch`.
      // Si la intención es que al limpiar los datos del préstamo también se limpie la UI de búsqueda,
      // entonces poner `shouldClearSearch: true` aquí tiene sentido.
      // El componente de búsqueda luego escucharía este cambio y actuaría (limpiando el input).
      shouldClearSearch: true,
    }),
}));
