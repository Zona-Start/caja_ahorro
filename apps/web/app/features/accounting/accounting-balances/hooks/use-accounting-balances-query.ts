import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingBalancesService } from '../services/accounting-balances-service';
import type { AccountingBalance } from '../schemas/accounting-balance.schema';

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
};

export function usePaginatedAccountingBalances(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  accountingCycleId?: string;
  companyId?: string;
}): UseQueryResult<{ data: AccountingBalance[]; meta: PaginationMeta }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingBalances.list(params),
    queryFn: () => AccountingBalancesService.getPaginated(params),
    enabled: !!params,
  });
}
