'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deletePurchaseOrderAction,
  savePurchaseOrderAction,
} from '../actions/purchase-order-actions';
import { PurchaseOrder } from '../schemas/purchase-order.schema';

// Mutation hook remains the same
export function usePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: PurchaseOrder) => savePurchaseOrderAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-by-id'] });
      // queryClient.invalidateQueries({ queryKey: ['purchase-orders-count'] });
      toast.success('Orden de compra guardada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Invoice with number')) {
          toast.error('Error, La orden de compra con ese número ya existe');
        } else {
          toast.error(
            'Error al crear la orden de compra, contacte al administrador',
          );
        }
      }
    },
  });

  return mutation;
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePurchaseOrderAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-by-id'] });
      // queryClient.invalidateQueries({ queryKey: ['purchase-orders-count'] });
      toast.success('Orden de compra eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('Error, La orden de compra no existe');
        } else {
          toast.error(
            'Error al eliminar la orden de compra, contacte al administrador',
          );
        }
      }
    },
  });
}
