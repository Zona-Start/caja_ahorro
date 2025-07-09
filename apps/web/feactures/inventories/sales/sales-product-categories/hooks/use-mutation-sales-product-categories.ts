import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteSalesProductCategory,
  saveSalesProductCategoryAction,
} from '../actions/sales-product-categories-actions';
import { SalesProductCategory } from '../schemas/sales-product-categories.schema';

export function useSalesProductCategoryMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: SalesProductCategory) =>
      saveSalesProductCategoryAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-product-categories'] });
      queryClient.invalidateQueries({
        queryKey: ['sales-product-categories-all'],
      });
      toast.success('Categoria de Producto guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la categoria');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteSalesProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteSalesProductCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-product-categories'] });
      queryClient.invalidateQueries({
        queryKey: [' sales-product-categories-all'],
      });
      toast.success('Categoria eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la Categoria');
      console.error('Error:', error);
    },
  });
}
