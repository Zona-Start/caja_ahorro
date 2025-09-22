import { useSafeQuery } from '@/hooks/use-safe-query';
import { getAssociatesByCedulaAction } from '../actions/individual-load.action';

export function useAssociatesByCedula(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useSafeQuery(
    ['assets-individual-load-associates-by-cedula', cedula],
    () => getAssociatesByCedulaAction(cedula),
    {
      enabled: cedula ? options?.enabled : false,
      staleTime: 0,
      cacheTime: 0,
      ...options,
    },
  );
}
