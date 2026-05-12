import { create } from 'zustand';

interface GeneralConfig {
  key: string;
  value: string;
}

interface ExchangeRate {
  date: string;
  rate: number;
}

interface Currency {
  id: number;
  code: string;
}

export interface SystemConfigState {
  generalConfig: GeneralConfig[];
  exchangeRates: ExchangeRate[];
  currencies: Currency[];
  setGeneralConfig: (config: GeneralConfig[]) => void;
  setExchangeRates: (rates: ExchangeRate[]) => void;
  setCurrencies: (currencies: Currency[]) => void;
}

export const useSystemConfigStore = create<SystemConfigState>((set) => ({
  generalConfig: [],
  exchangeRates: [],
  currencies: [],
  setGeneralConfig: (config) => set({ generalConfig: config }),
  setExchangeRates: (rates) => set({ exchangeRates: rates }),
  setCurrencies: (currencies) => set({ currencies }),
}));
