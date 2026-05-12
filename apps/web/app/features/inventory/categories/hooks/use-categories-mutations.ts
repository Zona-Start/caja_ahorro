import { CATEGORIES_KEYS } from '../keys/categories-keys';
import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { Category, CategoryMutation } from '../schemas/categories.schema';
import { categoriesService } from '../services/categories-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Se produjo un error al ejecutar la operación';
};

export function useSaveCategoryMutation(): UseMutationResult<
  Category,
  unknown,
  CategoryMutation
> {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => categoriesService.save(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: CATEGORIES_KEYS.detail(data.id),
      });

      success({
        title: variables.id ? 'Categoría actualizada' : 'Categoría creada',
        description: variables.id
          ? 'Los datos de la categoría se actualizaron correctamente.'
          : 'La categoría fue creada correctamente.',
      });
    },
    onError: (err) => {
      toastError(getErrorMessage(err));
    },
  });
}

export function useDeleteCategoryMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      success('La categoría fue eliminada correctamente.');
    },
    onError: (err) => {
      toastError(getErrorMessage(err));
    },
  });
}
