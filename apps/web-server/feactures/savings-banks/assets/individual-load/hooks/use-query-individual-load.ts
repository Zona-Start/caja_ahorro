import { useSafeQuery } from '@/hooks/use-safe-query';
import { queryKeys } from '@/lib/queryKeys';
import { UseQueryOptions } from '@tanstack/react-query';
import { getAssociatesByCedulaAction } from '../actions/individual-load.action';

export function useAssociatesByCedula(
  cedula: string,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>,
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
