import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingCyclesService } from '../services/accounting-cycles-service';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Error del servidor';
  }
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado';
}

export function useAccountingCycleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AccountingCycle) =>
      payload.id
        ? AccountingCyclesService.update(payload)
        : AccountingCyclesService.create(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingCycles.all,
      });
      toast({
        title: variables.id ? 'Ciclo actualizado' : 'Ciclo creado',
        description: `El ciclo contable ha sido ${variables.id ? 'actualizado' : 'creado'} exitosamente.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useChangeCycleStatusMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      AccountingCyclesService.changeStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingCycles.all,
      });
      toast({
        title: 'Estado actualizado',
        description:
          variables.status === 'OPEN'
            ? 'El ciclo ha sido cambiado a Abierto.'
            : 'El ciclo ha sido cambiado a Pendiente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccountingCycleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AccountingCyclesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingCycles.all,
      });
      toast({
        title: 'Ciclo eliminado',
        description: 'El ciclo contable ha sido eliminado exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
