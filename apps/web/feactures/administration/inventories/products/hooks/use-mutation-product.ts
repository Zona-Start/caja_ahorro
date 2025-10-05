import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteProduct, saveProductAction } from '../actions/product-actions';
import { Product } from '../schemas/product.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de productos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useProductMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Product) => saveProductAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.listAll() 
      });
      // Invalidar todos los detalles de productos
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Producto guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el producto');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un producto
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.listAll() 
      });
      // Invalidar todos los detalles de productos
      queryClient.invalidateQueries({ queryKey: ['product'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'Product not found') {
          toast.error('Error, Producto no encontrado');
        } else if (
          error.message === 'Cannot be deleted, there are sales of that product'
        ) {
          toast.error('No se puede eliminar, hay ventas de ese producto.');
        } else {
          toast.error('Error al eliminar el producto');
        }
      }
    },
  });
}
