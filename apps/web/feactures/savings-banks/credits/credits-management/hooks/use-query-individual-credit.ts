import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAssociatesByCedulaAction } from '../actions/credits-management-actions';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['credit-associates-individual-by-cedula', cedula],
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula ? options?.enabled : false,
      staleTime: 0,
      ...options,
    },
  );
}
