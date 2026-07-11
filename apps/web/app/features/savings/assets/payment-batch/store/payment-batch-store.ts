import { create } from 'zustand';

interface PaymentBatchModalState {
  isCreateOpen: boolean;
  isConfirmOpen: boolean;
  confirmBatchId: string | null;
  isDetailOpen: boolean;
  detailBatchId: string | null;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openConfirmModal: (batchId: string) => void;
  closeConfirmModal: () => void;
  openDetailModal: (batchId: string) => void;
  closeDetailModal: () => void;
}

export const usePaymentBatchModalStore = create<PaymentBatchModalState>((set) => ({
  isCreateOpen: false,
  isConfirmOpen: false,
  confirmBatchId: null,
  isDetailOpen: false,
  detailBatchId: null,
  openCreateModal: () => set({ isCreateOpen: true }),
  closeCreateModal: () => set({ isCreateOpen: false }),
  openConfirmModal: (batchId) => set({ isConfirmOpen: true, confirmBatchId: batchId }),
  closeConfirmModal: () => set({ isConfirmOpen: false, confirmBatchId: null }),
  openDetailModal: (batchId) => set({ isDetailOpen: true, detailBatchId: batchId }),
  closeDetailModal: () => set({ isDetailOpen: false, detailBatchId: null }),
}));
