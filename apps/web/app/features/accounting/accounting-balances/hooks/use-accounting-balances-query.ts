import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingBalancesService } from '../services/accounting-balances-service';
import type { AccountingBalance } from '../schemas/accounting-balance.schema';

export function usePaginatedAccountingBalances(params: any): UseQueryResult<{ data: AccountingBalance[]; meta: any }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingBalances.list(params),
    queryFn: () => AccountingBalancesService.getPaginated(params),
    enabled: !!params,
  });
}
