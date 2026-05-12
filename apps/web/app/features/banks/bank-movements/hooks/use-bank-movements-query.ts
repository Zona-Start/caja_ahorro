import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { bankMovementsKeys } from '../keys/bank-movements-keys';
import type {
  BankMovement,
  BankMovementForm,
} from '../schemas/bank-movement.schema';
import { bankMovementsService } from '../services/bank-movements-service';
import type { BankMovementsFilters } from './use-bank-movements-filters';

interface BankMovementsPaginatedResponse {
  data: BankMovement[];
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage?: boolean | null;
    hasPreviousPage?: boolean | null;
    nextPage?: number | null;
    previousPage?: number | null;
  };
}

const getErrorMessage = (error: unknown): string => {
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

export function useBankMovementsQuery(
  filters: BankMovementsFilters,
  enabled = true,
): UseQueryResult<BankMovementsPaginatedResponse> {
  return useQuery({
    queryKey: bankMovementsKeys.list(filters),
    queryFn: () => bankMovementsService.getAll(filters),
    enabled,
  });
}

export function useBankMovementQuery(
  id: number,
  enabled = true,
): UseQueryResult<BankMovement> {
  return useQuery({
    queryKey: bankMovementsKeys.detail(id),
    queryFn: () => bankMovementsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useCreateBankMovementMutation(): UseMutationResult<
  BankMovement,
  unknown,
  BankMovementForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => bankMovementsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento bancario creado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useUpdateBankMovementMutation(): UseMutationResult<
  BankMovement,
  unknown,
  { id: number; data: BankMovementForm }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, data }) =>
      bankMovementsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento bancario actualizado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useDeleteBankMovementMutation(): UseMutationResult<
  { message: string },
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => bankMovementsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento bancario eliminado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useSaveBankMovementMutation(): UseMutationResult<
  BankMovement,
  unknown,
  BankMovementForm & { id?: number }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => bankMovementsService.save(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess(
        variables.id
          ? 'Movimiento bancario actualizado correctamente'
          : 'Movimiento bancario creado correctamente',
      );
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}
