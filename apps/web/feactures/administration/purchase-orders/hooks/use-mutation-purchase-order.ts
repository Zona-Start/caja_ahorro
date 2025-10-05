'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deletePurchaseOrderAction,
  savePurchaseOrderAction,
} from '../actions/purchase-order-actions';
import { PurchaseOrder } from '../schemas/purchase-order.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de órdenes de compra
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePurchaseOrderMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: PurchaseOrder) => savePurchaseOrderAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.purchaseOrders.all() 
      });
      // Invalidar todos los detalles de órdenes de compra
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-by-id'] });
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

/**
 * Hook para eliminar una orden de compra
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePurchaseOrderAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.purchaseOrders.all() 
      });
      // Invalidar todos los detalles de órdenes de compra
      queryClient.invalidateQueries({ queryKey: ['purchase-orders-by-id'] });
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
