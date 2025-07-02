import { useSafeQuery } from '@/hooks/use-safe-query';
import { getWithdrawalTypesAction } from '../actions/withdrawal-types-actions';

// Hook for paginated type loans
export function useWithdrawalTypes(params = {}) {
  return useSafeQuery(['withdrawal-types', params], () =>
    getWithdrawalTypesAction(params),
  );
}
