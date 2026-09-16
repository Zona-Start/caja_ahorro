import { create } from 'zustand';

type ModalMode = 'create' | 'view';
type ExpenseNature = 'FIXED' | 'VARIABLE';

interface ExpenseModalState {
  isOpen: boolean;
  mode: ModalMode;
  nature: ExpenseNature;
  openModal: (nature?: ExpenseNature, mode?: ModalMode) => void;
  closeModal: () => void;
}

export const useExpenseModalStore = create<ExpenseModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  nature: 'VARIABLE',
  openModal: (nature = 'VARIABLE', mode = 'create') =>
    set({ isOpen: true, mode, nature }),
  closeModal: () => set({ isOpen: false, mode: 'create', nature: 'VARIABLE' }),
}));
