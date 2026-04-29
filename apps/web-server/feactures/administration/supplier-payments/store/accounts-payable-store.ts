import { create } from 'zustand';
import { AccountPayableSchemaAPI } from '../schemas/account-payable-api.schema';

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

interface AccountPayableState {
  data: AccountPayableSchemaAPI[];
  meta: Meta;
  isLoading: boolean;
  setData: (data: AccountPayableSchemaAPI[], meta: Meta) => void;
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

export const useAccountPayableStore = create<AccountPayableState>((set) => ({
  data: [],
  meta: initialMeta,
  isLoading: true,
  setData: (data, meta) => set({ data, meta, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
