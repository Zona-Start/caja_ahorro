'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteCategoryTypeAction,
  saveCategoryTypesAction,
} from '../actions/mutation-category-types';
import { CategoryTypes } from '../schemas/category-types-schemas';

// Mutation hook remains the same
export function useCategoryTypeMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (data: CategoryTypes) => saveCategoryTypesAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categoryTypes.all(),
      });
      toast.success('Tipo de Categoria guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la categoria');
    },
  });

  return mutation;
}

export function useDeleteCategoryType() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteCategoryTypeAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.categoryTypes.all(),
      });
      toast.success('Categoria eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la categoria');
    },
  });
}
