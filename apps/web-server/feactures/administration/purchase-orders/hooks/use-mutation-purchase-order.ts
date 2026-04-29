'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deletePurchaseOrderAction,
  savePurchaseOrderAction,
} from '../actions/purchase-order-actions';
import { PurchaseOrder } from '../schemas/purchase-order.schema';

/**
 * Hook para la mutación (crear/actualizar) de órdenes de compra
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: PurchaseOrder) => savePurchaseOrderAction(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.purchaseOrders.detail(data.id),
        });
      }

      toast.success('Orden de compra guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la orden de compra');
    },
  });
}

/**
 * Hook para eliminar una orden de compra
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deletePurchaseOrderAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.purchaseOrders.all(),
      });
      toast.crud.delete.success('Orden de compra');
    },
    onError: () => {
      toast.crud.delete.error('Orden de compra');
    },
  });
}
