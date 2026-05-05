import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingAccountsService } from '../services/accounting-accounts-service';
import type { AccountPlan } from '../schemas/account-plan.schema';

export function useAccountingAccounts(): UseQueryResult<AccountPlan[]> {
  return useQuery({
    queryKey: QUERY_KEYS.accountingAccounts.lists(),
    queryFn: () => AccountingAccountsService.getAll(),
  });
}

export function usePaginatedAccountingAccounts(params: any): UseQueryResult<{ data: AccountPlan[]; meta: any }> {
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
