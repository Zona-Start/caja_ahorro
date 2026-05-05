import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingEntriesService } from '../services/accounting-entries-service';
import type { AccountingEntry } from '../schemas/accounting-entry.schema';

export function usePaginatedAccountingEntries(params: any): UseQueryResult<{ data: AccountingEntry[]; meta: any }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingEntries.list(params),
    queryFn: () => AccountingEntriesService.getPaginated(params),
    enabled: !!params,
  });
}

export function useAccountingEntry(id: number): UseQueryResult<AccountingEntry> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingEntries.detail(id.toString()),
    queryFn: () => AccountingEntriesService.getById(id),
    enabled: !!id,
  });
}
