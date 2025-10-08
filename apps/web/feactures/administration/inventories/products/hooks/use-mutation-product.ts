'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProduct, saveProductAction } from '../actions/product-actions';
import { Product } from '../schemas/product.schema';

/**
 * Hook para la mutación (crear/actualizar) de productos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useProductMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: Product) => saveProductAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.products.detail(data.data.id),
        });
      }

      toast.success('Producto guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el producto');
    },
  });
}

/**
 * Hook para eliminar un producto
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(id),
      });
      toast.crud.delete.success('Producto');
    },
    onError: () => {
      toast.crud.delete.error('Producto');
    },
  });
}
