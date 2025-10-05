'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteSupplierTransactionAction,
  saveSupplierTransactionAction,
} from '../actions/supplier-transaction-actions';
import { SupplierTransaction } from '../schemas/supplier-transaction.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de transacciones de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSupplierTransactionMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: SupplierTransaction) => saveSupplierTransactionAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplierTransactions.all() 
      });
      // Invalidar todos los detalles de transacciones
      queryClient.invalidateQueries({ queryKey: ['supplier-transactions-by-id'] });
      toast.success('Transacción de proveedor guardada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        toast.error(
          error.message || 'Error al guardar la transacción de proveedor',
        );
      }
    },
  });

  return mutation;
}

/**
 * Hook para eliminar una transacción de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteSupplierTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierTransactionAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplierTransactions.all() 
      });
      // Invalidar todos los detalles de transacciones
      queryClient.invalidateQueries({ queryKey: ['supplier-transactions-by-id'] });
      toast.success('Transacción de proveedor eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('Error, La transacción de proveedor no existe');
        } else {
          toast.error(
            'Error al eliminar la transacción de proveedor, contacte al administrador',
          );
        }
      }
    },
  });
}
