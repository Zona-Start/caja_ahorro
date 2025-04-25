import { create } from 'zustand';

export enum CurrencyCodeEnum {
  VES = 'VES',
  USD = 'USD',
}

export interface Currency {
  id: number;
  code: CurrencyCodeEnum;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

export interface ExchangeRates {
  id: number;
  date: Date;
  fromCurrencyCode: CurrencyCodeEnum;
  toCurrencyCode: CurrencyCodeEnum;
  rate: number;
  source: string;
}

export interface GeneralConfig {
  key: string;
  value: string;
  description: string;
  group: string;
}

interface SystemConfigState {
  generalConfig: GeneralConfig[];
  currencies: Currency[];
  exchangeRates: ExchangeRates[];
  setGeneralConfig: (config: GeneralConfig[]) => void;
  setCurrencies: (currencies: Currency[]) => void;
  setExchangeRates: (exchangeRates: ExchangeRates[]) => void;
  updateGeneralConfigItem: (key: string, value: string) => Promise<void>;
  isInitialConfigLoading: boolean;
  isInitialConfigError: any;
}

export const useSystemConfigStore = create<SystemConfigState>((set, get) => ({
  generalConfig: [],
  currencies: [],
  exchangeRates: [],
  setGeneralConfig: (generalConfig) => set({ generalConfig }),
  setCurrencies: (currencies) => set({ currencies }),
  setExchangeRates: (exchangeRates) => set({ exchangeRates }),
  updateGeneralConfigItem: async (key: string, value: string) => {
    // const currentConfig = get().generalConfig;
    // if (currentConfig && currentConfig[key] !== value) {
    //     try {
    //         const updatedConfigItem = await updateGeneralConfigAction({ key, value });
    //         set((state) => ({
    //             generalConfig: {
    //                 ...state.generalConfig,
    //                 [key]: updatedConfigItem.value, // Asumo que la acción devuelve el item actualizado
    //             },
    //         }));
    //     } catch (error) {
    //         console.error(`Error updating general config item with key ${key}:`, error);
    //         // Manejar el error
    //         throw error;
    //     }
    // }
  },
  isInitialConfigLoading: false, // Inicialmente en false
  isInitialConfigError: null, // Inicialmente en null
}));
