import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { QUERY_KEYS } from '@/lib/query-keys';
import { purchaseOrdersService } from '../services/purchase-orders-service';
import type { PurchaseOrder } from '../schemas/purchase-orders.schema';

export function usePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (payload: PurchaseOrder) =>
      payload.id
        ? purchaseOrdersService.update(payload)
        : purchaseOrdersService.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.purchaseOrders.all,
      });
      success(
        variables.id
          ? 'Orden de compra actualizada exitosamente.'
          : 'Orden de compra creada exitosamente.',
      );
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : 'Ha ocurrido un error al guardar la orden de compra.';
      error(message);
    },
  });
}

export function useDeletePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => purchaseOrdersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.purchaseOrders.all,
      });
      success('Orden de compra eliminada exitosamente.');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : 'Ha ocurrido un error al eliminar la orden de compra.';
      error(message);
    },
  });
}
