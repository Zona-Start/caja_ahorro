import { create } from 'zustand';

type ModalMode = 'create' | 'view';

interface ExpenseModalState {
  isOpen: boolean;
  mode: ModalMode;
  openModal: (mode?: ModalMode) => void;
  closeModal: () => void;
}

export const useExpenseModalStore = create<ExpenseModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  openModal: (mode = 'create') => set({ isOpen: true, mode }),
  closeModal: () => set({ isOpen: false, mode: 'create' }),
}));
