import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingCyclesService } from '../services/accounting-cycles-service';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';

export function useAccountingCycles(): UseQueryResult<AccountingCycle[]> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingCycles.lists(),
    queryFn: () => AccountingCyclesService.getAll(),
  });
}

export function usePaginatedAccountingCycles(params: any): UseQueryResult<{ data: AccountingCycle[]; meta: any }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingCycles.list(params),
    queryFn: () => AccountingCyclesService.getPaginated(params),
    enabled: !!params,
  });
}

export function useAccountingCycle(id: number): UseQueryResult<AccountingCycle> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingCycles.detail(id.toString()),
    queryFn: () => AccountingCyclesService.getById(id),
    enabled: !!id,
  });
}
