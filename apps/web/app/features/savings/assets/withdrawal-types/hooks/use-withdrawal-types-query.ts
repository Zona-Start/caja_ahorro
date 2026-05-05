import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { withdrawalTypesService } from '../services/withdrawal-types-service';
import { type WithdrawalTypes } from '../schemas/withdrawal-types.schema';

export function useWithdrawalTypesQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: QUERY_KEYS.withdrawalTypes.list(JSON.stringify(params)),
    queryFn: () => withdrawalTypesService.getWithdrawalTypes(params),
  });
}

export function useSaveWithdrawalTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalTypes) =>
      withdrawalTypesService.saveWithdrawalType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.withdrawalTypes.all,
      });
    },
  });
}

export function useDeleteWithdrawalTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => withdrawalTypesService.deleteWithdrawalType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.withdrawalTypes.all,
      });
    },
  });
}
