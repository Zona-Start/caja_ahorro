import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAssociatesByCedulaAction } from '../actions/settlement-actions';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['settlement-associate-individual-by-cedula'], // Use a query key that includes the cedula
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula?.trim() ? options?.enabled : false,
      staleTime: 0,
      refetchOnMount: false,
      ...options,
    },
  );
}
