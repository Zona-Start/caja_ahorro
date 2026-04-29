import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getPaginatedAccountingBalancesAction } from '../actions/accounting-balance-actions';

export function usePaginatedAccountingBalances(params = {}) {
  return useSafeQuery(
    queryKeys.accountingBalances.paginated(params),
    () => getPaginatedAccountingBalancesAction(params),
    { enabled: Object.keys(params).length > 0 },
  );
}
