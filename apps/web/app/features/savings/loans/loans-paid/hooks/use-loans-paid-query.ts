import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { loansPaidService } from '../services/loans-paid-service';

export function useLoansPaidQuery(params?: {
  page?: number;
  limit?: number;
  search?: string;
  loanId?: number;
}): UseQueryResult<{ data: unknown[]; meta: unknown }, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansPaid.list(JSON.stringify(params)),
    queryFn: () => loansPaidService.getLoansPaid(params || {}),
  });
}

export function useLoanPaidById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.loansPaid.detail(id),
    queryFn: () => loansPaidService.getLoanPaidById(id),
    enabled: options?.enabled ?? !!id,
  });
}