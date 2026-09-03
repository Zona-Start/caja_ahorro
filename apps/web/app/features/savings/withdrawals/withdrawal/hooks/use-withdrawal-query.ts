import { QUERY_KEYS } from '@/lib/query-keys';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from '@repo/shadcn/hooks/use-toast';
import { useToastSystem } from '@/hooks/use-toast-system';
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

export function useBulkImportWithdrawals(
  onSuccess?: (data: {
    message: string;
    processedCount: number;
    errorCount: number;
    errors?: { cedula: string; monto: number; error: string }[];
    accountingWarnings?: { cedula: string; warning: string }[];
  }) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (formData: FormData) => withdrawalService.bulkImport(formData),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
      onSuccess?.(data);
    },
    onError: (error: any) => {
      toast.error({
        title: 'Error de carga',
        description:
          error?.response?.data?.message ??
          error?.message ??
          'Error en la carga masiva de retiros.',
      });
    },
  });
}

export function useDownloadWithdrawalTemplate() {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: () => withdrawalService.downloadTemplate(),
    onSuccess: (base64: string) => {
      try {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_retiros_masivos.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success({
          title: 'Plantilla descargada',
          description: 'El archivo Excel ha sido generado con éxito.',
        });
      } catch {
        toast.error({
          title: 'Error',
          description: 'Error al procesar el archivo. Por favor intente de nuevo.',
        });
      }
    },
    onError: () => {
      toast.error({
        title: 'Error',
        description: 'Error al descargar la plantilla. Por favor, intente de nuevo.',
      });
    },
  });
}
