import { create } from 'zustand';
import { LoanDisbursementBatch } from '../schemas/loan-disbursement/batch-api-response';

interface LoanDisbursementBatchState {
  selectedLoanDisbursementBatch: LoanDisbursementBatch | null;
  setSelectedLoanDisbursementBatch: (batch: LoanDisbursementBatch | null) => void;
  clearAllLoanDisbursementBatchData: () => void;
}

const initialState = {
  selectedLoanDisbursementBatch: null,
};

export const useLoanDisbursementBatchStore = create<LoanDisbursementBatchState>((set) => ({
  ...initialState,
  setSelectedLoanDisbursementBatch: (batch) => set({ selectedLoanDisbursementBatch: batch }),
  clearAllLoanDisbursementBatchData: () => set({ ...initialState }),
}));