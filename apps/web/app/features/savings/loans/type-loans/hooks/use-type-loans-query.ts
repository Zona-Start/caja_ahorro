import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { typeLoansService } from '../services/type-loans-service';

export function useTypeLoansQuery(): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.typeLoans.all(),
    queryFn: () => typeLoansService.getAll(),
  });
}

export function useTypeLoanById(
  id: number,
  options?: { enabled?: boolean }
): UseQueryResult<unknown, Error> {
  return useQuery({
    queryKey: QUERY_KEYS.typeLoans.detail(id),
    queryFn: () => typeLoansService.getById(id),
    enabled: options?.enabled ?? !!id,
  });
}