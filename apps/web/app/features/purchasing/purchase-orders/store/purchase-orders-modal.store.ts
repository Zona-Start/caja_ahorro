import { create } from 'zustand';

type ModalMode = 'create' | 'edit' | 'view';

interface PurchaseOrdersModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: { id?: string; [key: string]: unknown } | null;
  openModal: (mode: ModalMode, data?: { id?: string; [key: string]: unknown } | null) => void;
  closeModal: () => void;
}

export const usePurchaseOrdersModalStore = create<PurchaseOrdersModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: null,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: null }),
}));
