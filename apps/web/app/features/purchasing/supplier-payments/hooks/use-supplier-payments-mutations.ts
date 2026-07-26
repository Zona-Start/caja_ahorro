import { useToastSystem } from '@/hooks/use-toast-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type {
  BulkPaymentPayload,
  PayAdvancePayload,
  ReversePaymentsPayload,
} from '../services/supplier-payments-service';
import { supplierPaymentsService } from '../services/supplier-payments-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Se produjo un error';
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

export function useBulkPaymentMutation() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload: BulkPaymentPayload) => supplierPaymentsService.pay(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] as const });
      toastSuccess('Pago registrado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function usePayAdvanceMutation() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload: PayAdvancePayload) => supplierPaymentsService.payAdvance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] as const });
      toastSuccess('Anticipo registrado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useReversePaymentMutation() {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload: ReversePaymentsPayload) => supplierPaymentsService.reverse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] as const });
      toastSuccess('Pago reversado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}
