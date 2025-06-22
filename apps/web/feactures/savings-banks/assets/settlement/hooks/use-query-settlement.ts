import { useSafeQuery } from '@/hooks/use-safe-query';
import { getSettlementAction } from '../actions/settlement-actions';

// // Hook for withdrawal list
export function useQuerySettlement(params = {}) {
  return useSafeQuery(['settlement-all', params], () =>
    getSettlementAction(params),
  );
}
