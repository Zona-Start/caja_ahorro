import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getLinkablesAction } from '../actions/bank-movement-actions';
import { BankTransactionCategory } from '../schemas/bank-movement-options';

export const useGetLinkables = (params: {
  category: BankTransactionCategory;
  q?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) => {
  return useSafeQuery(
    queryKeys.linkables.list(params),
    () => getLinkablesAction(params),
    {
      enabled: params.enabled, // Controla si la consulta se ejecuta automáticamente
    },
  );
};
