import { useToastSystem } from '@/hooks/use-toast-system';
import { QUERY_KEYS } from '@/lib/query-keys';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import type { LoanPaymentBulkResponse } from '../schemas/loans-paid-api-response';
import { loansPaidService } from '../services/loans-paid-service';

export function useCreateLoanPaymentMutation(): UseMutationResult<
  { message: string },
  Error,
  Record<string, unknown>,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payment: Record<string, unknown>) =>
      loansPaidService.createLoanPayment(payment),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.loansPaid.all,
      });
      toast.success('Pago registrado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al registrar el pago');
    },
  });
}

export function useDeleteLoanPaymentMutation(): UseMutationResult<
  { message: string },
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => loansPaidService.deleteLoanPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.loansPaid.all,
      });
      toast.success('Pago anulado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al anular el pago');
    },
  });
}

export function useBulkUploadLoanPayment(): UseMutationResult<
  LoanPaymentBulkResponse,
  Error,
  FormData,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => loansPaidService.bulkUpload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.loansPaid.all,
      });
    },
  });
}

export function useDownloadLoanPaymentTemplate(): UseMutationResult<
  string,
  Error,
  void,
  unknown
> {
  return useMutation({
    mutationFn: () => loansPaidService.downloadTemplate(),
  });
}
