import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAssociatesByCedulaAction } from '../actions/credits-paid-actions';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.associatesForCreditsPaid.byCedula(cedula),
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula?.trim() ? options?.enabled : false,
      staleTime: 0,
      refetchOnMount: false,
      ...options,
    },
  );
}


