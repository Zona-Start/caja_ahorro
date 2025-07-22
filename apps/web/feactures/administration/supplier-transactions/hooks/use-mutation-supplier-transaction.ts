'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteSupplierTransactionAction,
  saveSupplierTransactionAction,
} from '../actions/supplier-transaction-actions';
import { SupplierTransaction } from '../schemas/supplier-transaction.schema';

export function useSupplierTransactionMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: SupplierTransaction) => saveSupplierTransactionAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-transactions'] });
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

export function useDeleteSupplierTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierTransactionAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-transactions'] });
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
