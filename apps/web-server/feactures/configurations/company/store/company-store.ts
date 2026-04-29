import { create } from 'zustand';
import { CompanyFormValue } from '../schemas/company';

interface CompanyStore {
  company: CompanyFormValue | null;
  setCompany: (data: CompanyFormValue) => void;
  clearCompany: () => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  company: null,
  setCompany: (data) => set({ company: data }),
  clearCompany: () => set({ company: null }),
}));
