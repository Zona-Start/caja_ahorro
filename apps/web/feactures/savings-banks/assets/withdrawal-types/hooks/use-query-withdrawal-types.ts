import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getWithdrawalTypesAction } from '../actions/withdrawal-types-actions';

// Hook for paginated type loans
export function useWithdrawalTypes(params = {}) {
  return useSafeQuery(queryKeys.withdrawalTypes.list(params), () =>
    getWithdrawalTypesAction(params),
  );
}
