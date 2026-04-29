'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteInventoryMovement,
  saveInventoryMovementAction,
} from '../actions/inventory-movement-actions';
import { CreateInventoryMovement } from '../schemas/inventory-movement.schema';

/**
 * Hook para la mutación (crear/actualizar) de movimientos de inventario
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useInventoryMovementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: CreateInventoryMovement) =>
      saveInventoryMovementAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryMovements.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.fixedAssets.all(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventoryMovements.detail(data.data.id),
        });
      }

      toast.success('Movimiento de inventario guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el movimiento de inventario');
    },
  });
}

/**
 * Hook para eliminar un movimiento de inventario
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteInventoryMovementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteInventoryMovement(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryMovements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryMovements.detail(id),
      });
      toast.crud.delete.success('Movimiento de inventario');
    },
    onError: () => {
      toast.crud.delete.error('Movimiento de inventario');
    },
  });
}
