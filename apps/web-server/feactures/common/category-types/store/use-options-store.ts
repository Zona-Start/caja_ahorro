import { create } from 'zustand';

interface OptionsState {
  showOptions: boolean;
  toggleOptions: (params: boolean) => void;
}

export const useOptionsStore = create<OptionsState>((set) => ({
  showOptions: false,
  toggleOptions: (params: boolean) => set((state) => ({ showOptions: params })),
}));
