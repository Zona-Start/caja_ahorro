import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingEntriesService } from '../services/accounting-entries-service';
import type { AccountingEntry } from '../schemas/accounting-entry.schema';

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function usePaginatedAccountingEntries(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  accountingCycleId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{ data: AccountingEntry[]; meta: PaginationMeta }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingEntries.list(params),
    queryFn: () => AccountingEntriesService.getPaginated(params),
    enabled: !!params,
  });
}

export function useAccountingEntry(id: string): UseQueryResult<AccountingEntry> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingEntries.detail(id),
    queryFn: () => AccountingEntriesService.getById(id),
    enabled: !!id,
  });
}
