'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reversePaymentsAction } from '../actions/supplier-payment-actions';

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