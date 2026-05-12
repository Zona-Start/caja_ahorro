import { create } from 'zustand';
import type { Product } from '../schemas/products.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface ProductsModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: Product;
  openModal: (mode: ModalMode, data?: Product) => void;
  closeModal: () => void;
}

export const useProductsModalStore = create<ProductsModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
