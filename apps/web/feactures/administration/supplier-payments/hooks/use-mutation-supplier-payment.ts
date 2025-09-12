'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  payAccountPayableAction,
  reversePaymentsAction,
} from '../actions/supplier-payment-actions';
import { PayAccountPayable } from '../schemas';

export function useReversePaymentMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { paymentIds: number[] }) => reversePaymentsAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Pagos reversados exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al reversar los pagos');
    },
  });

  return mutation;
}

// hook para guardar datos de un pago
export function usePayAccountPayableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayAccountPayable) => payAccountPayableAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['payments-by-supplier'] });
      queryClient.invalidateQueries({
        queryKey: ['accounts-payable-advances'],
      });

      toast.success('Pago procesado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar el pago');
    },
  });
}
