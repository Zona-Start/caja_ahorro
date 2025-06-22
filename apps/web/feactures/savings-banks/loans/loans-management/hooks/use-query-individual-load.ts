import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAssociatesByCedulaAction } from '../actions/loans-management-actions';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['loans-associates-by-cedula'],
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula ? options?.enabled : false,
      staleTime: 0,
      ...options,
    },
  );
}
