import { create } from 'zustand';
import { PaymentBatch } from '../schemas/payment-batch-api-response';

interface PaymentBatchState {
  selectedPaymentBatch: PaymentBatch | null;
  setSelectedPaymentBatch: (batch: PaymentBatch | null) => void;
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