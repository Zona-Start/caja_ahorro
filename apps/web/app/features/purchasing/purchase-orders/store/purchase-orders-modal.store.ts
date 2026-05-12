import { create } from 'zustand';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface PurchaseOrdersModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: PurchaseOrder;
  openModal: (mode: ModalMode, data?: PurchaseOrder) => void;
  closeModal: () => void;
}

export const usePurchaseOrdersModalStore =
  create<PurchaseOrdersModalState>((set) => ({
    isOpen: false,
    mode: 'create',
    data: undefined,
    openModal: (mode, data) => set({ isOpen: true, mode, data }),
    closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
  }));
