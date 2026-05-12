import { create } from 'zustand';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface InventoryFixedAssetsModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: InventoryFixedAsset;
  openModal: (mode: ModalMode, data?: InventoryFixedAsset) => void;
  closeModal: () => void;
}

export const useInventoryFixedAssetsModalStore =
  create<InventoryFixedAssetsModalState>((set) => ({
    isOpen: false,
    mode: 'create',
    data: undefined,
    openModal: (mode, data) => set({ isOpen: true, mode, data }),
    closeModal: () =>
      set({ isOpen: false, mode: 'create', data: undefined }),
  }));
