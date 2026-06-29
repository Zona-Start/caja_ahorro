import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { AccountingEntriesService } from '../services/accounting-entries-service';
import type { AccountingEntry } from '../schemas/accounting-entry.schema';

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'Error del servidor';
  }
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado';
}

export function useAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: AccountingEntry) =>
      payload.id
        ? AccountingEntriesService.update(payload)
        : AccountingEntriesService.create(payload),
    onSuccess: (_data, variables) => {
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
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AccountingEntriesService.delete(id),
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
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AccountingEntriesService.submit(id),
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
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function usePostAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AccountingEntriesService.post(id),
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
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useCancelAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => AccountingEntriesService.cancel(id),
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
        description: extractErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
