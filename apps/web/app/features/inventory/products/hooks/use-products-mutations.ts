import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ProductsService } from '../services/products-service';
import type { Product } from '../schemas/products.schema';

export function useProductMutation() {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: async (payload: Product & { _suppliers?: { suppliersId: string; leadTimeDays: number }[] }) => {
      const { _suppliers, ...productPayload } = payload;

      const body = {
        ...productPayload,
        suppliers: _suppliers ?? [],
      };

      const result = productPayload.id
        ? await ProductsService.update(body as Product)
        : await ProductsService.create(body as Product);

      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.products.all,
      });
      success(
        variables.id
          ? 'Producto actualizado exitosamente.'
          : 'Producto creado exitosamente.',
      );
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Ha ocurrido un error al guardar el producto.';
      error(message);
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id: string) => ProductsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.products.all,
      });
      success('Producto eliminado exitosamente.');
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Ha ocurrido un error al eliminar el producto.';
      error(message);
    },
  });
}
