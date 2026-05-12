import { useQuery, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { associatesLoanApiResponseSchema, type AssociatesLoan } from '../schemas/individual-load-api-schema';

export function useAssociatesLoanSearchQuery(
  cedula: string,
  options?: { enabled?: boolean }
): UseQueryResult<AssociatesLoan, Error> & {
  refetch: () => void;
} {
  const queryClient = useQueryClient();

  const queryKey = ['loansPaid', 'byCedula', cedula] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get(`/loans-paid/search-associate/${cedula}`);
      const result = associatesLoanApiResponseSchema.parse(response.data);
      return result.data;
    },
    enabled: options?.enabled ?? false,
  });

  return {
    ...query,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}
