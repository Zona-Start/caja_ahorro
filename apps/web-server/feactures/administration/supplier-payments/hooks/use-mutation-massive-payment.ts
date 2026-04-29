'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMassivePaymentAction } from '../actions/massive-payment.actions';
import { CreateSupplierPaymentDto } from '../schemas/massive-payment.schema';

/**
 * Hook para procesar pagos masivos de proveedores
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useMassivePaymentMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: CreateSupplierPaymentDto[]) =>
      createMassivePaymentAction(data),
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
      toast.success('Pagos masivos procesados exitosamente');
    },
    onError: () => {
      toast.error('Error al procesar los pagos masivos');
    },
  });
}
