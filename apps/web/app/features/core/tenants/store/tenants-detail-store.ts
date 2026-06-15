import { create } from 'zustand';
import type { Tenant } from '../schemas/tenants.schema';

interface TenantsDetailState {
  isOpen: boolean;
  data?: Tenant;
  openDetail: (data: Tenant) => void;
  closeDetail: () => void;
}

export const useTenantsDetailStore = create<TenantsDetailState>((set) => ({
  isOpen: false,
  data: undefined,
  openDetail: (data) => set({ isOpen: true, data }),
  closeDetail: () => set({ isOpen: false, data: undefined }),
}));
