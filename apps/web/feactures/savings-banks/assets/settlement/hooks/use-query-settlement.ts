import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getSettlementAction } from '../actions/settlement-actions';

// // Hook for withdrawal list
export function useQuerySettlement(params = {}) {
  return useSafeQuery(queryKeys.settlements.list(params), () =>
    getSettlementAction(params),
  );
}
