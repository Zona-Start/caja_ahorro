'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteSupplierTransactionAction,
  saveSupplierTransactionAction,
} from '../actions/supplier-transaction-actions';
import { SupplierTransaction } from '../schemas/supplier-transaction.schema';

/**
 * Hook para la mutación (crear/actualizar) de transacciones de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSupplierTransactionMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: SupplierTransaction) =>
      saveSupplierTransactionAction(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.supplierTransactions.detail(data.id),
        });
      }

      toast.success('Transacción de proveedor guardada exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar la transacción de proveedor');
    },
  });
}

/**
 * Hook para eliminar una transacción de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteSupplierTransaction() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierTransactionAction(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.detail(id),
      });
      toast.crud.delete.success('Transacción de proveedor');
    },
    onError: () => {
      toast.crud.delete.error('Transacción de proveedor');
    },
  });
}
