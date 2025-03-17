'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteCategoryTypeAction,
  saveCategoryTypesAction,
} from '../actions/mutation-category-types';
import { CategoryTypes } from '../schemas/category-types-schemas';

export const CATEGORIES_TYPES_KEY = ['categories-types'];
export const PAGINATED_CATEGORIES_TYPES_KEY = ['paginated_categories_types'];

// Mutation hook remains the same
export function useCategoryTypeMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CategoryTypes) => saveCategoryTypesAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_TYPES_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_CATEGORIES_TYPES_KEY,
      });
      toast.success('Tipo de Categoria guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la categoria');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteCategoryType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategoryTypeAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_TYPES_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_CATEGORIES_TYPES_KEY,
      });
      toast.success('Categoria eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la categoria');
      console.error('Error:', error);
    },
  });
}
