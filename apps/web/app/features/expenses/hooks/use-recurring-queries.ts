import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { RecurringForm } from '../schemas/recurring.schema';
import {
  recurringService,
  type RecurringQueryParams,
} from '../services/recurring-service';

export const recurringKeys = {
  all: ['recurring-expenses'] as const,
  list: (filters: object) => [...recurringKeys.all, 'list', filters] as const,
};

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

export function useRecurringQuery(
  params: RecurringQueryParams,
): UseQueryResult<{
  data: import('../schemas/recurring.schema').RecurringTemplate[];
  meta: { totalCount: number; totalPages: number };
}> {
  return useQuery({
    queryKey: recurringKeys.list(params),
    queryFn: () => recurringService.getAllPaginated(params),
  });
}

export function useSaveRecurringMutation(): UseMutationResult<
  unknown,
  unknown,
  RecurringForm & { id?: string }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) =>
      payload.id
        ? recurringService.update(payload.id, payload)
        : recurringService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      toastSuccess(
        variables.id
          ? 'Plantilla recurrente actualizada'
          : 'Plantilla recurrente creada: se programará automáticamente',
      );
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useDeleteRecurringMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => recurringService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all });
      toastSuccess('Plantilla desactivada correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
