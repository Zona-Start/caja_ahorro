import { QUERY_KEYS } from '@/lib/query-keys';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from '@repo/shadcn/hooks/use-toast';
import { withdrawalService } from '../services/withdrawal-service';
import { type Withdrawal } from '../schemas/withdrawal.schema';

export function useWithdrawalsQuery(filters: Record<string, any>) {
  return useQuery({
    queryKey: QUERY_KEYS.withdrawals.list(filters),
    queryFn: () => withdrawalService.getWithdrawals(filters),
  });
}

export function useWithdrawalTypesQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.withdrawals.types(),
    queryFn: () => withdrawalService.getWithdrawalTypes(),
  });
}

export function useAssociateWithdrawalRequestQuery(
  cedula: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...QUERY_KEYS.withdrawals.all, 'request', cedula] as const,
    queryFn: () => withdrawalService.getAssociatesByCedula(cedula),
    ...options,
  });
}

export function useSaveWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Withdrawal) =>
      withdrawalService.saveWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
    },
  });
}

export function useApproveWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => withdrawalService.approveWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
      toast({ title: 'Retiro aprobado exitosamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message ?? error.message ?? 'Error al aprobar',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => withdrawalService.deleteWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
      toast({ title: 'Retiro anulado exitosamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message ?? error.message ?? 'Error al anular',
        variant: 'destructive',
      });
    },
  });
}

export function useDisburseWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { bankAccountId: string; processedAt: Date; bankReference?: string };
    }) => withdrawalService.disburseWithdrawal(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
    },
  });
}

export function useProcessWithdrawalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => withdrawalService.processWithdrawal(id),
  onSuccess: (data: any) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
    toast({ title: 'Retiro procesado exitosamente' });
    if (data?.accountingWarning) {
      toast({
        title: 'Advertencia Contable',
        description: data.accountingWarning,
      });
    }
  },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.message ?? error.message ?? 'Error al procesar',
        variant: 'destructive',
      });
    },
  });
}
