import { create } from 'zustand';

type ModalMode = 'pay' | 'payAdvance' | 'viewHistory';

interface SupplierPaymentsModalState {
  isOpen: boolean;
  mode: ModalMode;
  accountPayableId?: number;
  paymentId?: number;
  openModal: (mode: ModalMode, accountPayableId?: number, paymentId?: number) => void;
  closeModal: () => void;
}

export const useSupplierPaymentsModalStore = create<SupplierPaymentsModalState>((set) => ({
  isOpen: false,
  mode: 'pay',
  accountPayableId: undefined,
  paymentId: undefined,
  openModal: (mode, accountPayableId, paymentId) =>
    set({ isOpen: true, mode, accountPayableId, paymentId }),
  closeModal: () =>
    set({
      isOpen: false,
      mode: 'pay',
      accountPayableId: undefined,
      paymentId: undefined,
    }),
}));
