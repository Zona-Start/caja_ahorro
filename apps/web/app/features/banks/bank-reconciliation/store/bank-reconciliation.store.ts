import { create } from 'zustand';
import type { BankReconciliation } from '../schemas/bank-reconciliation.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface BankReconciliationState {
  isOpen: boolean;
  mode: ModalMode;
  data?: BankReconciliation;
  openModal: (mode: ModalMode, data?: BankReconciliation) => void;
  closeModal: () => void;
}

export const useBankReconciliationStore = create<BankReconciliationState>(
  (set) => ({
    isOpen: false,
    mode: 'create',
    data: undefined,
    openModal: (mode, data) => set({ isOpen: true, mode, data }),
    closeModal: () =>
      set({ isOpen: false, mode: 'create', data: undefined }),
  }),
);
