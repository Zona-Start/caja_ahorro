import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAssociatesByCedulaAction } from '../actions/withdrawal-actions';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['withdrawal-associate-individual'], // Use a query key that includes the cedula
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula?.trim() ? options?.enabled : false,
      staleTime: 0,
      refetchOnMount: false,
      ...options,
    },
  );
}
