import { create } from 'zustand';
import { SupplierPayment } from '../schemas';

interface Meta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

interface SupplierPaymentState {
  data: SupplierPayment[];
  meta: Meta;
  isLoading: boolean;
  setData: (data: SupplierPayment[], meta: Meta) => void;
  setLoading: (isLoading: boolean) => void;
}

const initialMeta: Meta = {
  page: 1,
  limit: 10,
  totalCount: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
};

export const useSupplierPaymentStore = create<SupplierPaymentState>((set) => ({
  data: [],
  meta: initialMeta,
  isLoading: true,
  setData: (data, meta) => set({ data, meta, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
