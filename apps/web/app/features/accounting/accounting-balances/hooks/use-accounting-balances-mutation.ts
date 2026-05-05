import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingBalancesService } from '../services/accounting-balances-service';
import type { InitialLoad, CloseCycle, OpenCycle } from '../schemas/accounting-balance.schema';

export function useBootstrappingMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: InitialLoad) => AccountingBalancesService.bootstrapping(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingBalances.all,
      });
      toast({
        title: 'Balances cargados',
        description: 'La carga inicial de balances se ha realizado exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error al cargar los balances.',
        variant: 'destructive',
      });
    },
  });
}

export function useBootstrappingWithFileMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (file: File) => AccountingBalancesService.bootstrappingWithFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingBalances.all,
      });
      toast({
        title: 'Archivo procesado',
        description: 'El archivo de balances ha sido procesado exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error al procesar el archivo.',
        variant: 'destructive',
      });
    },
  });
}

export function useCloseCycleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ cycleId, payload }: { cycleId: number; payload: CloseCycle }) => 
      AccountingBalancesService.closeCycle(cycleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingBalances.all,
      });
      toast({
        title: 'Ciclo cerrado',
        description: 'El ciclo contable ha sido cerrado exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error al cerrar el ciclo.',
        variant: 'destructive',
      });
    },
  });
}

export function useOpenCycleMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: OpenCycle) => AccountingBalancesService.openCycle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingBalances.all,
      });
      toast({
        title: 'Ciclo abierto',
        description: 'El nuevo ciclo contable ha sido abierto exitosamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Ha ocurrido un error al abrir el ciclo.',
        variant: 'destructive',
      });
    },
  });
}
