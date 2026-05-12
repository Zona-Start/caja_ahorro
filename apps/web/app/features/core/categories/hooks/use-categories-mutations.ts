import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { type Category, type CategoryMutation } from '../schemas/categories.schema';
import { categoriesService } from '../services/categories-service';
import { CATEGORIES_KEYS } from '../keys/categories-keys';

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => categoriesService.save(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      toast({
        title: variables.id ? 'Categoría actualizada' : 'Categoría creada',
        description: variables.id
          ? 'Los datos de la categoría se actualizaron correctamente.'
          : 'La categoría fue creada correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCategoryMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEYS.all });
      toast({
        title: 'Categoría eliminada',
        description: 'La categoría fue eliminada correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
