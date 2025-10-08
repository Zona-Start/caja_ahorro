'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteInventoryCategory,
  saveInventoryCategoryAction,
} from '../actions/inventory-categories-actions';
import { InventoryCategory } from '../schemas/inventory-category.schema';

/**
 * Hook para la mutación (crear/actualizar) de categorías de inventario
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useInventoryCategoryMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: InventoryCategory) => saveInventoryCategoryAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCategories.all(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventoryCategories.detail(data.data.id),
        });
      }

      toast.success('Categoría de inventario guardada exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar la categoría de inventario');
    },
  });
}

/**
 * Hook para eliminar una categoría de inventario
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteInventoryCategoryMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteInventoryCategory(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCategories.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventoryCategories.detail(id),
      });
      toast.crud.delete.success('Categoría de inventario');
    },
    onError: () => {
      toast.crud.delete.error('Categoría de inventario');
    },
  });
}
