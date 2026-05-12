import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingAccountsService } from '../services/accounting-accounts-service';
import type { AccountPlan } from '../schemas/account-plan.schema';

type PaginationMeta = {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
};

export function useAccountingAccounts(): UseQueryResult<AccountPlan[]> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingAccounts.lists(),
    queryFn: () => AccountingAccountsService.getAll(),
  });
}

export function usePaginatedAccountingAccounts(params: {
  page?: number;
  limit?: number;
  level?: string;
  type?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): UseQueryResult<{ data: AccountPlan[]; meta: PaginationMeta }> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingAccounts.list(params),
    queryFn: () => AccountingAccountsService.getPaginated(params),
    enabled: !!params,
  });
}

export function useAccountingAccount(id: number): UseQueryResult<AccountPlan> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingAccounts.detail(id.toString()),
    queryFn: () => AccountingAccountsService.getById(id),
    enabled: !!id,
  });
}
