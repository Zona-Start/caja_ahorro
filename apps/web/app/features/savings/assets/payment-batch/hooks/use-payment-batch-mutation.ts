import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { paymentBatchService } from '../services/payment-batch-service';

export function useCreatePaymentBatchMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (dto: unknown) => paymentBatchService.createPaymentBatch(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paymentBatches.all(),
      });
      toast.success('Lote de pago creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el lote de pago');
    },
  });
}

export function useMarkAsUploadedMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => paymentBatchService.markAsUploaded(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paymentBatches.all(),
      });
      toast.success('Lote marcado como subido');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al marcar el lote');
    },
  });
}

export function useConfirmPaymentBatchMutation(): UseMutationResult<
  unknown,
  Error,
  { id: number; dto: unknown },
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: unknown }) =>
      paymentBatchService.confirmPaymentBatch(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paymentBatches.all(),
      });
      toast.success('Lote confirmado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al confirmar el lote');
    },
  });
}

export function useCancelPaymentBatchMutation(): UseMutationResult<
  unknown,
  Error,
  number,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => paymentBatchService.cancelPaymentBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.paymentBatches.all(),
      });
      toast.success('Lote cancelado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cancelar el lote');
    },
  });
}

export function useDownloadTxtFileMutation(): UseMutationResult<
  { fileName: string; content: string },
  Error,
  number,
  unknown
> {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => paymentBatchService.downloadTxtFile(id),
    onSuccess: (data) => {
      const blob = new Blob([data.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Archivo TXT descargado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al descargar el archivo');
    },
  });
}