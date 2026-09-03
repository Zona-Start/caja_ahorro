import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { creditsPaidService } from '../services/credits-paid-service';
import type { CreditPaymentBulkResponse } from '../schemas/credits-paid-api-response';

export function useCreateCreditPaymentMutation(): UseMutationResult<
  { message: string },
  Error,
  Record<string, unknown>,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payment: Record<string, unknown>) =>
      creditsPaidService.createCreditPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditsPaid.lists(),
      });
      toast.success('Pago registrado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar el pago');
    },
  });
}

export function useDeleteCreditPaymentMutation(): UseMutationResult<
  { message: string },
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => creditsPaidService.deleteCreditPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditsPaid.lists(),
      });
      toast.success('Pago cancelado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cancelar el pago');
    },
  });
}

export function useBulkUploadCreditPayment(): UseMutationResult<
  CreditPaymentBulkResponse,
  Error,
  FormData,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => creditsPaidService.bulkUpload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.creditsPaid.lists(),
      });
    },
  });
}

export function useDownloadCreditPaymentTemplate(): UseMutationResult<
  string,
  Error,
  void,
  unknown
> {
  return useMutation({
    mutationFn: () => creditsPaidService.downloadTemplate(),
  });
}
