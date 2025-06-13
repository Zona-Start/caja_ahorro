import { create } from 'zustand';
import { AssociatesWithdrawal } from '../schemas/individual-withdrawal-api-schema'; // Asegúrate que la ruta es correcta
import { WithdrawalType } from '../schemas/withdrawal-api-response';

interface WithdrawalState {
  selectedAssociate: AssociatesWithdrawal | null;
  selectedWithdrawlType: WithdrawalType | null;
  enabledTime: boolean;
  setEnabledTime: (enabledTime: boolean) => void;
  setSelectedAssociate: (associate: AssociatesWithdrawal | null) => void;
  setselectedWithdrawlType: (withdrawlType: WithdrawalType | null) => void;
  shouldClearSearch: boolean;
  setShouldClearSearch: (clear: boolean) => void;
  withdrawalSummary: {
    totalWithdrawal: string;
    totalPayable: string;
    installmentAmount: string;
  } | null;
  setWithdrawalSummary: (summary: WithdrawalState['withdrawalSummary']) => void;
  formValues: any; // Considera tipar esto de forma más específica si es posible
  setFormValues: (values: any) => void;
  // Nueva acción para limpiar los datos relacionados con el asociado y el préstamo
  clearAllLoanData: () => void;
}

const initialState = {
  selectedAssociate: null,
  selectedWithdrawlType: null,
  withdrawalSummary: null,
  enabledTime: true,
  formValues: {},
};

export const useWithdrawalStore = create<WithdrawalState>((set) => ({
  selectedAssociate: initialState.selectedAssociate,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),

  selectedWithdrawlType: initialState.selectedWithdrawlType,
  setselectedWithdrawlType: (withdrawlType) =>
    set({ selectedWithdrawlType: withdrawlType }),

  enabledTime: initialState.enabledTime,
  setEnabledTime: (enabledTime) => set({ enabledTime: enabledTime }),

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
      // Opcional: decidir si `clearAllLoanData` debe también activar `shouldClearSearch`.
      // Si la intención es que al limpiar los datos del préstamo también se limpie la UI de búsqueda,
      // entonces poner `shouldClearSearch: true` aquí tiene sentido.
      // El componente de búsqueda luego escucharía este cambio y actuaría (limpiando el input).
      shouldClearSearch: true,
    }),
}));
