import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingCyclesService } from '../services/accounting-cycles-service';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};

export function useAccountingCycles(): UseQueryResult<AccountingCycle[]> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingCycles.lists(),
    queryFn: () => AccountingCyclesService.getAll(),
  });
}

export function usePaginatedAccountingCycles(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{ data: AccountingCycle[]; meta: PaginationMeta }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingCycles.list(params),
    queryFn: () => AccountingCyclesService.getPaginated(params),
    enabled: !!params,
  });
}

export function useAccountingCycle(
  id: string,
): UseQueryResult<AccountingCycle> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingCycles.detail(id),
    queryFn: () => AccountingCyclesService.getById(id),
    enabled: !!id,
  });
}
