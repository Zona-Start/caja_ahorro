import { create } from 'zustand';

type ModalMode = 'create' | 'edit' | 'view';

interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: unknown;
  openModal: (mode: ModalMode, data?: unknown) => void;
  closeModal: () => void;
}

export const useGlobalSettingsModalStore = create<ModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
