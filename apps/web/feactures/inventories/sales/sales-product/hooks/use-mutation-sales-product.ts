import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteSalesProduct,
  saveSalesProductAction,
} from '../actions/sales-product-actions';
import { SalesProduct } from '../schemas/sales-product.schema';

export function useSalesProductMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: SalesProduct) => saveSalesProductAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      toast.success('Producto de venta guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el producto de venta');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteSalesProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSalesProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-products'] });
      toast.success('Producto de venta eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'Sales product not found') {
          toast.error('Error, Producto de venta no encontrado');
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
