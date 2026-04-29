import { useQuery } from '@tanstack/react-query';
import {
  getBankReconciliationsAction,
  getBankReconciliationByIdAction,
  getBankReconciliationPaginatedAction,
} from '../actions/bank-reconciliation-actions';
import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';

export const useQueryBankReconciliations = (bankAccountId?: number) => {
  return useQuery({
    queryKey: ['bank-reconciliations', bankAccountId],
    queryFn: () => getBankReconciliationsAction(bankAccountId),
  });
};

export const useQueryBankReconciliationById = (id: number) => {
  return useQuery({
    queryKey: ['bank-reconciliations', id],
    queryFn: () => getBankReconciliationByIdAction(id),
    enabled: !!id,
  });
};



// Hook for paginated accounts
export function useBanksReconciliationQuery(params = {}) {
  return useSafeQuery(queryKeys.bankReconciliations.list(params), () =>
    getBankReconciliationPaginatedAction(params),
  );
}

