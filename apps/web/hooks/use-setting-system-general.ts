import {
  getCurrencyAction,
  getExchangeRateAction,
  getSettingSytemAllAction,
} from '@/server/setting-system-config';
import { useSafeQuery } from './use-safe-query';

// Hook for paginated setting sytem data
export function useSettingsSystemConfig() {
  return useSafeQuery(['setting-system'], () => getSettingSytemAllAction());
}

export function useCurrenciesConfig() {
  return useSafeQuery(['currencies'], () => getCurrencyAction());
}

export function useExchangeRateConfig() {
  return useSafeQuery(['exchange-rate'], () => getExchangeRateAction());
}
