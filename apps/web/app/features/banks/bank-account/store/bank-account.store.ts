import { create } from 'zustand';
import type { BankAccount } from '../schemas/bank-account.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface BankAccountState {
  isOpen: boolean;
  mode: ModalMode;
  data?: BankAccount;
  openModal: (mode: ModalMode, data?: BankAccount) => void;
  closeModal: () => void;
}

export const useBankAccountStore = create<BankAccountState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
