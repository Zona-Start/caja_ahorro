import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingEntriesService } from '../services/accounting-entries-service';
import type { AccountingEntry } from '../schemas/accounting-entry.schema';

export function useAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AccountingEntry) =>
      payload.id
        ? AccountingEntriesService.update(payload)
        : AccountingEntriesService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingEntries.all,
      });
      toast({
        title: variables.id ? 'Asiento actualizado' : 'Asiento creado',
        description: `El asiento contable ha sido ${variables.id ? 'actualizado' : 'creado'} exitosamente.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al guardar el asiento.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingEntriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingEntries.all,
      });
      toast({
        title: 'Asiento eliminado',
        description: 'El asiento contable ha sido eliminado exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al eliminar el asiento.',
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingEntriesService.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingEntries.all,
      });
      toast({
        title: 'Asiento enviado',
        description: 'El asiento contable ha sido enviado para su revisión.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al enviar el asiento.',
        variant: 'destructive',
      });
    },
  });
}

export function usePostAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingEntriesService.post(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingEntries.all,
      });
      toast({
        title: 'Asiento contabilizado',
        description: 'El asiento contable ha sido contabilizado exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al contabilizar el asiento.',
        variant: 'destructive',
      });
    },
  });
}

export function useCancelAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => AccountingEntriesService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.accountingEntries.all,
      });
      toast({
        title: 'Asiento anulado',
        description: 'El asiento contable ha sido anulado exitosamente.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Ha ocurrido un error al anular el asiento.',
        variant: 'destructive',
      });
    },
  });
}
