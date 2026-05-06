import type { CurrenciesFilters } from '../services/currencies-service';

export const CURRENCIES_KEYS = {
  all: ['currencies'] as const,
  lists: () => [...CURRENCIES_KEYS.all, 'list'] as const,
  list: (filters?: CurrenciesFilters) => [...CURRENCIES_KEYS.lists(), filters] as const,
  details: () => [...CURRENCIES_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CURRENCIES_KEYS.details(), id] as const,
};