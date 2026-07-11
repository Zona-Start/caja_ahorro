import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { paymentBatchService } from '../services/payment-batch-service';
import { paymentBatchKeys } from '../keys/payment-batch-keys';

export function useCreatePaymentBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: Parameters<typeof paymentBatchService.createPaymentBatch>[0]) =>
      paymentBatchService.createPaymentBatch(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentBatchKeys.lists() });
    },
  });
}

export function useMarkAsUploadedMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => paymentBatchService.markAsUploaded(id),
    onSuccess: () => {
      toast.success('Lote marcado como subido');
      queryClient.invalidateQueries({ queryKey: paymentBatchKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al marcar como subido');
    },
  });
}

export function useConfirmPaymentBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Parameters<typeof paymentBatchService.confirmPaymentBatch>[1];
    }) => paymentBatchService.confirmPaymentBatch(id, dto),
    onSuccess: () => {
      toast.success('Lote procesado exitosamente');
      queryClient.invalidateQueries({ queryKey: paymentBatchKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar el lote');
    },
  });
}

export function useCancelPaymentBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => paymentBatchService.cancelPaymentBatch(id),
    onSuccess: () => {
      toast.success('Lote anulado');
      queryClient.invalidateQueries({ queryKey: paymentBatchKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al anular el lote');
    },
  });
}

export function useDownloadTxtFileMutation() {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename?: string }) =>
      paymentBatchService.downloadTxtFile(id, filename),
    onSuccess: (result) => {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Archivo TXT descargado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al descargar');
    },
  });
}
