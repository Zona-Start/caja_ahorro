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
      toast.error('Error al eliminar la Categoria');
      console.error('Error:', error);
    },
  });
}
