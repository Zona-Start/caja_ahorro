import { create } from 'zustand';
import type { InventoryService } from '../schemas/inventory-services.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface InventoryServicesModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: InventoryService;
  openModal: (mode: ModalMode, data?: InventoryService) => void;
  closeModal: () => void;
}

export const useInventoryServicesModalStore =
  create<InventoryServicesModalState>((set) => ({
    isOpen: false,
    mode: 'create',
    data: undefined,
    openModal: (mode, data) => set({ isOpen: true, mode, data }),
    closeModal: () =>
      set({ isOpen: false, mode: 'create', data: undefined }),
  }));
