import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAssociatesByCedulaAction } from '../actions/settlement-actions';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['settlement-associate-individual-by-cedula', cedula], // Include cedula in query key
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula?.trim() ? options?.enabled : false,
      staleTime: 0,
      cacheTime: 0,
      refetchOnMount: false,
      ...options,
    },
  );
}
