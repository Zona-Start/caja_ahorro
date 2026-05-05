import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditsPaidService } from '../services/credits-paid-service';

export function useCreditsPaidQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  creditId?: number;
}): UseQueryResult<{ data: unknown[]; meta: unknown }, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditsPaid.list(JSON.stringify(params)),
    queryFn: () => creditsPaidService.getCreditsPaid(params || {}),
  });
}

export function useCreditPaidById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.creditsPaid.detail(id),
    queryFn: () => creditsPaidService.getCreditPaidById(id),
    enabled: options?.enabled ?? !!id,
  });
}