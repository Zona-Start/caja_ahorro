import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { accountsPayableKeys } from '../keys/accounts-payable-keys';
import type {
  AccountsPayableApi,
  AppliedTransactionsListResponse,
} from '../schemas/accounts-payable-api.schema';
import type { AccountsPayablePaginatedResponse } from '../services/accounts-payable-service';
import { accountsPayableService } from '../services/accounts-payable-service';
import type { AccountsPayableFilters } from './use-accounts-payable-filters';

export function useAccountsPayableQuery(
  filters: AccountsPayableFilters,
  enabled = true,
): UseQueryResult<AccountsPayablePaginatedResponse> {
  return useQuery({
    queryKey: accountsPayableKeys.list(filters),
    queryFn: () => accountsPayableService.getAll(filters),
    enabled,
  });
}

export function useAccountsPayableDetailQuery(
  id: string,
  enabled = true,
): UseQueryResult<AccountsPayableApi> {
  return useQuery({
    queryKey: accountsPayableKeys.detail(id),
    queryFn: () => accountsPayableService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useAppliedTransactionsQuery(
  id: string,
  enabled = true,
): UseQueryResult<AppliedTransactionsListResponse> {
  return useQuery({
    queryKey: accountsPayableKeys.appliedTransactions(id),
    queryFn: () => accountsPayableService.getAppliedTransactions(id),
    enabled: enabled && !!id,
  });
}
