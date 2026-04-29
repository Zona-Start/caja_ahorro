import { UseQueryOptions, useQuery } from '@tanstack/react-query';

/**
 * Hook seguro para useQuery que acepta arrays de longitud variable como queryKey
 * Compatible con el patrón de Query Key Factory
 */
export function useSafeQuery<T>(
  queryKey: ReadonlyArray<unknown>,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

