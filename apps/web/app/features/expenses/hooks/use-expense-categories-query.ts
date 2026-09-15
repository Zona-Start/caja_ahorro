import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { expenseCategoriesKeys } from '../keys/expenses-keys';
import type { ExpenseCategoryMutation } from '../schemas/expense-categories.schema';
import {
  expenseCategoriesService,
  type ExpenseCategoriesPaginatedResponse,
  type ExpenseCategoriesQueryParams,
} from '../services/expense-categories-service';

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

export function useExpenseCategories(): UseQueryResult<{
  data: Array<{ id: string; name: string }>;
}> {
  return useQuery({
    queryKey: expenseCategoriesKeys.all,
    queryFn: () => expenseCategoriesService.getAll(),
  });
}

export function useExpenseCategoriesQuery(
  params: ExpenseCategoriesQueryParams,
  enabled = true,
): UseQueryResult<ExpenseCategoriesPaginatedResponse> {
  return useQuery({
    queryKey: expenseCategoriesKeys.list(params),
    queryFn: () => expenseCategoriesService.getAllPaginated(params),
    enabled,
  });
}

export function useExpenseCategoryQuery(
  id: string,
  enabled = true,
): UseQueryResult<{ data: { id: string; name: string; isActive: boolean } }> {
  return useQuery({
    queryKey: expenseCategoriesKeys.detail(id),
    queryFn: () => expenseCategoriesService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useSaveExpenseCategoryMutation(): UseMutationResult<
  unknown,
  unknown,
  ExpenseCategoryMutation
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => expenseCategoriesService.save(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseCategoriesKeys.all });
      toastSuccess(
        variables.id
          ? 'Categoría de gasto actualizada correctamente'
          : 'Categoría de gasto creada correctamente',
      );
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useDeleteExpenseCategoryMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => expenseCategoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseCategoriesKeys.all });
      toastSuccess('Categoría de gasto desactivada correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
