'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createMassivePaymentAction } from '../actions/massive-payment.actions';
import { CreateSupplierPaymentDto } from '../schemas/massive-payment.schema';

//hook para pagos masivos
export function useMassivePaymentMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateSupplierPaymentDto[]) =>
      createMassivePaymentAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['payments-by-supplier'] });
      queryClient.invalidateQueries({
        queryKey: ['accounts-payable-advances'],
      });
      toast.success('Pagos masivos procesados exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar los pagos masivos');
    },
  });

  return mutation;
}
