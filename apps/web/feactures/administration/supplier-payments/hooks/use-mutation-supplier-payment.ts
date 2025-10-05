'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  payAccountPayableAction,
  reversePaymentsAction,
} from '../actions/supplier-payment-actions';
import { PayAccountPayable } from '../schemas';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para reversar/anular pagos de proveedores
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useReversePaymentMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { paymentIds: number[] }) => reversePaymentsAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplierPayments.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountsPayable.all() 
      });
      toast.success('Pagos reversados exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al reversar los pagos');
    },
  });

  return mutation;
}

/**
 * Hook para procesar pagos de cuentas por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePayAccountPayableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayAccountPayable) => payAccountPayableAction(data),
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
      toast.success('Pago procesado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar el pago');
    },
  });
}
