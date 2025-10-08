import { queryKeys } from '@/lib/queryKeys';
import {
  getCurrencyAction,
  getExchangeRateAction,
  getSettingSytemAllAction,
} from '@/server/setting-system-config';
import { useSafeQuery } from './use-safe-query';

// Hook for paginated setting sytem data
export function useSettingsSystemConfig() {
  return useSafeQuery(queryKeys.settingsSystem.all(), () =>
    getSettingSytemAllAction(),
  );
}

export function useCurrenciesConfig() {
  return useSafeQuery(queryKeys.currencies.all(), () => getCurrencyAction());
}

export function useExchangeRateConfig() {
  return useSafeQuery(queryKeys.exchangeRate.all(), () =>
    getExchangeRateAction(),
  );
}
