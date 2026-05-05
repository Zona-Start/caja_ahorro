import { create } from 'zustand';
import type { Associates } from '../schemas/individual-load-api-schema';

interface IndividualLoadStore {
  selectedAssociate: Associates | null;
  searchQuery: string;
  isSearching: boolean;
  errors: string[];

  setSelectedAssociate: (associate: Associates | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  clearAll: () => void;
  setRestrictions: (restrictions: string[]) => void;
}

export const useIndividualLoadStore = create<IndividualLoadStore>((set) => ({
  selectedAssociate: null,
  searchQuery: '',
  isSearching: false,
  errors: [],

  setSelectedAssociate: (associate) =>
    set({ selectedAssociate: associate, errors: [] }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setRestrictions: (restrictions) => set({ errors: restrictions }),
  clearAll: () =>
    set({
      selectedAssociate: null,
      searchQuery: '',
      isSearching: false,
      errors: [],
    }),
}));