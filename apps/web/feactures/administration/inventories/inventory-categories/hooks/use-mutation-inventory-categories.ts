import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteInventoryCategory,
  saveInventoryCategoryAction,
} from '../actions/inventory-categories-actions';
import { InventoryCategory } from '../schemas/inventory-category.schema';

export function useInventoryCategoryMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: InventoryCategory) =>
      saveInventoryCategoryAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      queryClient.invalidateQueries({
        queryKey: ['inventory-categories-all'],
      });
      toast.success('Categoria de Inventario guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la categoria');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInventoryCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
      queryClient.invalidateQueries({
        queryKey: ['inventory-categories-all'],
      });
      toast.success('Categoria eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'Category not found') {
          toast.error('Error, Categoria no encontrada');
        } else if (
          error.message === 'Cannot be deleted, Product Category is in use'
        ) {
          toast.error('Error, Categoria en uso  no se puede eliminar');
        } else {
          toast.error('Error al eliminar la Categoria');
        }
      }
    },
  });
}
