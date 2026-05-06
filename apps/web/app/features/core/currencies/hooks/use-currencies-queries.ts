import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { currenciesService } from '../services/currencies-service';
import type { Currency } from '../schemas/currencies.schema';
import type { CurrenciesFilters } from './use-currencies-filters';

export function useCurrenciesQuery(
  filters?: CurrenciesFilters,
): UseQueryResult<Currency[]> {
  return useQuery({
    queryKey: QUERY_KEYS.currencies.list(filters),
    queryFn: () => currenciesService.getAll(filters),
  });
}

export function useCurrencyByIdQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<Currency> {
  return useQuery({
    queryKey: QUERY_KEYS.currencies.detail(id),
    queryFn: () => currenciesService.getById(id),
    enabled: enabled && !!id,
  });
}