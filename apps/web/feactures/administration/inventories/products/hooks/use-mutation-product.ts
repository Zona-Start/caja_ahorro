import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteProduct,
  saveProductAction,
} from '../actions/product-actions';
import { Product } from '../schemas/product.schema';

export function useProductMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Product) => saveProductAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
      toast.success('Producto guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el producto');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-all'] });
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
