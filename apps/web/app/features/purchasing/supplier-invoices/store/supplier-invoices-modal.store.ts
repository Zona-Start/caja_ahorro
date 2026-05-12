import { create } from 'zustand';
import type { SupplierInvoiceApi } from '../schemas/supplier-invoice-api.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface SupplierInvoicesModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: SupplierInvoiceApi;
  openModal: (mode: ModalMode, data?: SupplierInvoiceApi) => void;
  closeModal: () => void;
}

export const useSupplierInvoicesModalStore = create<SupplierInvoicesModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
