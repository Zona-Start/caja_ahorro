import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAssociatesByCedulaAction } from '../actions/withdrawal-actions';

import { UseQueryResult } from '@tanstack/react-query';
import { AssociatesWithdrawal } from '../schemas/individual-withdrawal-api-schema';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean; [key: string]: any },
): UseQueryResult<AssociatesWithdrawal | null, Error> {
  return useSafeQuery(
    queryKeys.associatesForWithdrawal.byCedula(cedula),
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula?.trim() ? options?.enabled : false,
      staleTime: 0,
      refetchOnMount: false,
      ...options,
    } as any,
  );
}
