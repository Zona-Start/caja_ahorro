import { create } from 'zustand';
import type { InventoryMovement } from '../schemas/movements.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface MovementsModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: InventoryMovement;
  openModal: (mode: ModalMode, data?: InventoryMovement) => void;
  closeModal: () => void;
}

export const useMovementsModalStore = create<MovementsModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
