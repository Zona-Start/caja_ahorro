import { create } from 'zustand';
import { type AssociatesLoan } from '../schemas/individual-loan-api-schema';

interface LoanManagementState {
  selectedAssociate: AssociatesLoan | null;
  shouldClearSearch: boolean;
  loanSummary: {
    totalQuota: string;
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
    totalDisbursement: string;
  } | null;
  formValues: Record<string, unknown>;
  setSelectedAssociate: (associate: AssociatesLoan | null) => void;
  setShouldClearSearch: (clear: boolean) => void;
  setLoanSummary: (
    summary: LoanManagementState['loanSummary'],
  ) => void;
  setFormValues: (values: Record<string, unknown>) => void;
  clearAllLoanData: () => void;
}

const initialFormValues: Record<string, unknown> = {
  id: '0',
  creditTypeId: '',
  creditModality: '',
  requestDate: new Date(),
  requestedAmount: '',
  startDate: new Date(),
  endDate: '',
  termUnits: '',
  termType: 'Plazos',
  status: 'REQUESTED',
  paymentMethod: '',
  disbursementAccountId: undefined,
  interestRate: '',
  expensesAmount: '',
  overdraftAmount: null,
  notes: '',
};

export const useLoanManagementStore = create<LoanManagementState>((set) => ({
  selectedAssociate: null,
  shouldClearSearch: false,
  loanSummary: null,
  formValues: initialFormValues,
  setSelectedAssociate: (associate) => set({ selectedAssociate: associate }),
  setShouldClearSearch: (clear) => set({ shouldClearSearch: clear }),
  setLoanSummary: (summary) => set({ loanSummary: summary }),
  setFormValues: (values) => set({ formValues: values }),
  clearAllLoanData: () =>
    set({
      selectedAssociate: null,
      shouldClearSearch: false,
      loanSummary: null,
      formValues: initialFormValues,
    }),
}));
