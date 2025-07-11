import { create } from 'zustand';

interface InvoicesPayableStore {
  // Aquí puedes agregar el estado relevante para las facturas si es necesario
}

export const useBankAccountStore = create<InvoicesPayableStore>((set, get) => ({
  // Aquí puedes inicializar el estado relevante para las facturas si es necesario
}));
