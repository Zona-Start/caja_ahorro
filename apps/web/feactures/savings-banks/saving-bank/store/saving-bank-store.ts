import { create } from 'zustand';
import { SavingBankFormValue } from '../schemas/saving-bank';

interface SavingBankStore {
  savingBank: SavingBankFormValue | null;
  setSavingBank: (data: SavingBankFormValue) => void;
  clearSavingBank: () => void;
}

export const useSavingBankStore = create<SavingBankStore>((set) => ({
  savingBank: null,
  setSavingBank: (data) => set({ savingBank: data }),
  clearSavingBank: () => set({ savingBank: null }),
}));