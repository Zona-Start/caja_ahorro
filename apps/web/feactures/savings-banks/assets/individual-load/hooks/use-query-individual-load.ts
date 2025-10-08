import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { getAssociatesByCedulaAction } from '../actions/individual-load.action';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    queryKeys.associatesForIndividualAssetLoad.byCedula(cedula),
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula ? options?.enabled : false,
      staleTime: 0,
      ...options,
    },
  );
}
