import { create } from 'zustand';

interface PaymentBatchState {
  selectedPaymentBatch: unknown | null;
  setSelectedPaymentBatch: (batch: unknown | null) => void;
  clearAllPaymentBatchData: () => void;
}

const initialState = {
  selectedPaymentBatch: null,
};

export const usePaymentBatchStore = create<PaymentBatchState>((set) => ({
  ...initialState,
  setSelectedPaymentBatch: (batch) => set({ selectedPaymentBatch: batch }),
  clearAllPaymentBatchData: () => set({ ...initialState }),
}));