'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  payAccountPayableAction,
  payAdvanceAction,
  reversePaymentsAction,
} from '../actions/supplier-payment-actions';
import { PayAccountPayableHookAction, PayAdvance } from '../schemas';

/**
 * Hook para reversar/anular pagos de proveedores
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useReversePaymentMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: { paymentIds: number[] }) => reversePaymentsAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierPayments.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      toast.success('Pagos reversados exitosamente');
    },
    onError: () => {
      toast.error('Error al reversar los pagos');
    },
  });
}

/**
 * Hook para procesar pagos de cuentas por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePayAccountPayableMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: PayAccountPayableHookAction) =>
      payAccountPayableAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierPayments.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.all(),
      });
      toast.success('Pago procesado exitosamente');
    },
    onError: () => {
      toast.error('Error al procesar el pago');
    },
  });
}

export function usePayAdvanceMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: PayAdvance) => payAdvanceAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierPayments.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.all(),
      });
      toast.success('Pago procesado exitosamente');
    },
    onError: () => {
      toast.error('Error al procesar el pago');
    },
  });
}
