import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAccountsPayableAction } from '../actions/accounts-payable-actions';

export function useAccountsPayable(
  params: {
    page?: number;
    limit?: number;
    status?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    supplierIds?: number[];
  } = {},
  options?: { enabled?: boolean },
) {
  return useSafeQuery(['accounts-payable', params], () =>
    getAccountsPayableAction(params),
    {
        ...options,
    }
  );
}
