import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getLinkablesAction } from '../actions/bank-movement-actions';
import { BankTransactionCategory } from '../schemas/bank-movement-options';

export const useGetLinkables = (params: {
  category: BankTransactionCategory;
  valueDate: string;
  enabled?: boolean;
}) => {
  return useSafeQuery(
    queryKeys.linkables.byParams(params),
    () => getLinkablesAction(params),
    {
      enabled: params.enabled, // Controla si la consulta se ejecuta automáticamente
    },
  );
};
