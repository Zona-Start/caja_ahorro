'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createMassivePaymentAction } from '../actions/massive-payment.actions';
import { CreateSupplierPaymentDto } from '../schemas/massive-payment.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para procesar pagos masivos de proveedores
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useMassivePaymentMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateSupplierPaymentDto[]) =>
      createMassivePaymentAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountsPayable.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplierPayments.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountsPayable.advances() 
      });
      toast.success('Pagos masivos procesados exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar los pagos masivos');
    },
  });

  return mutation;
}
