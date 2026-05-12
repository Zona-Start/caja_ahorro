import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingCyclesService } from '../services/accounting-cycles-service';
import type { AccountingCycle } from '../schemas/accounting-cycle.schema';

export function useAccountingCycleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AccountingCycle) =>
      payload.id
        ? AccountingCyclesService.update(payload)
        : AccountingCyclesService.create(payload),
    onSuccess: (data, variables) => {
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
        description: (error as Error)?.message || 'Ha ocurrido un error al guardar el ciclo.',
        variant: 'destructive',
      });
    },
  });
}

export function useCloseAccountingCycleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingCyclesService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingCycles.all,
      });
      toast({
        title: 'Ciclo cerrado',
        description: 'El ciclo contable ha sido cerrado exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al cerrar el ciclo.',
        variant: 'destructive',
      });
    },
  });
}
