import { create } from 'zustand';
import type { Category } from '../schemas/categories.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface CategoriesModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: Category;
  openModal: (mode: ModalMode, data?: Category) => void;
  closeModal: () => void;
}

export const useCategoriesModalStore = create<CategoriesModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
