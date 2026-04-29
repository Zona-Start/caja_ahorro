import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getPaginatedBankMovementsAction } from '../actions/bank-movement-actions';

export const useGetBankMovements = (params: {
  page?: number;
  limit?: number;
  bankAccountId?: number;
  startDate?: string;
  endDate?: string;
}) => {
  return useSafeQuery(queryKeys.bankMovements.list(params), () =>
    getPaginatedBankMovementsAction(params),
  );
};
