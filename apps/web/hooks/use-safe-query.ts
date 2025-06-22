import { UseQueryOptions, useQuery } from '@tanstack/react-query';

export function useSafeQuery<T, K = unknown>(
  queryKey: [string, K?],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

