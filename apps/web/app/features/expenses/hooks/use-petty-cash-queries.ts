import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { pettyCashKeys } from '../keys/expenses-keys';
import type { PettyCashForm } from '../schemas/petty-cash.schema';
import {
  pettyCashService,
  type PettyCashQueryParams,
} from '../services/petty-cash-service';

interface PettyCashPaginatedResponse {
  data: Array<Record<string, unknown> & { id: string }>;
  meta: { page: number; limit: number; totalCount: number; totalPages: number };
}

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

export function usePettyCashQuery(
  params: PettyCashQueryParams,
): UseQueryResult<PettyCashPaginatedResponse> {
  return useQuery({
    queryKey: pettyCashKeys.list(params),
    queryFn: () => pettyCashService.getAllPaginated(params),
  });
}

export function usePettyCashAll(): UseQueryResult<{
  data: Array<{
    id: string;
    name: string;
    currentBalance: string;
    currencyCode: string;
  }>;
}> {
  return useQuery({
    queryKey: pettyCashKeys.all,
    queryFn: async () => {
      const response = await pettyCashService.getAll();
      return { data: response.data || [] };
    },
  });
}

export function useCreatePettyCashMutation(): UseMutationResult<
  unknown,
  unknown,
  PettyCashForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => pettyCashService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      toastSuccess('Fondo fijo creado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useReplenishPettyCashMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; amount: number; concept: string }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, amount, concept }) =>
      pettyCashService.replenish(id, { amount, concept }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      toastSuccess('Fondo fijo repuesto correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
