import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { withdrawalService } from '../services/withdrawal-service';
import { type Withdrawal } from '../schemas/withdrawal.schema';

export function useWithdrawalsQuery(params: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  sortBy?: string;
  status?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: QUERY_KEYS.withdrawals.list(JSON.stringify(params)),
    queryFn: () => withdrawalService.getWithdrawals(params),
  });
}

export function useWithdrawalTypesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.withdrawals.types(),
    queryFn: () => withdrawalService.getWithdrawalTypes(),
  });
}

export function useAssociateWithdrawalRequestQuery(cedula: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.withdrawals.all, 'request', cedula],
    queryFn: () => withdrawalService.getAssociatesByCedula(cedula),
    ...options,
  });
}

export function useSaveWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Withdrawal) => withdrawalService.saveWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.all });
    },
  });
}

export function useApproveWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => withdrawalService.approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.all });
    },
  });
}

export function useDeleteWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => withdrawalService.deleteWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.all });
    },
  });
}

export function useDisburseWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      withdrawalService.disburseWithdrawal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.all });
    },
  });
}

export function useProcessWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => withdrawalService.processWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.all });
    },
  });
}
