import { create } from 'zustand';
import type { Supplier } from '../schemas/suppliers.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface SuppliersModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: Supplier;
  openModal: (mode: ModalMode, data?: Supplier) => void;
  closeModal: () => void;
}

export const useSuppliersModalStore = create<SuppliersModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
