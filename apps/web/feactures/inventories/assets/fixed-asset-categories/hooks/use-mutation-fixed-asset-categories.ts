import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteFixedAssetCategories,
  saveFixedAssetCategoriesAction,
} from '../actions/fixed-asset-categories-actions';
import { FixedAssetCategories } from '../schemas/fixed-asset-categories.schema';

export function useFixedAssetCategoriesMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FixedAssetCategories) =>
      saveFixedAssetCategoriesAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-asset-categories'] });
      queryClient.invalidateQueries({
        queryKey: ['fixed-asset-categories-all'],
      });
      toast.success('Categoria guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la categoria');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteFixedAssetCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFixedAssetCategories(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-asset-categories'] });
      queryClient.invalidateQueries({
        queryKey: ['fixed-asset-categories-all'],
      });
      toast.success('Categoria eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'Fixed asset category not found') {
          toast.error('Error, Categoria no encontrada');
        } else if (
          error.message === 'Cannot be deleted, the asset category is in use'
        ) {
          toast.error('Error, Categoria en uso no se puede eliminar');
        } else {
          toast.error('Error al eliminar la Categoria');
        }
      }
    },
  });
}
