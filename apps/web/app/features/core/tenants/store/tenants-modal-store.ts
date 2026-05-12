import { create } from 'zustand';
import type { Tenant } from '../schemas/tenants.schema';

type ModalMode = 'create' | 'edit' | 'view';

interface TenantsModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: Tenant;
  openModal: (mode: ModalMode, data?: Tenant) => void;
  closeModal: () => void;
}

export const useTenantsModalStore = create<TenantsModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));
