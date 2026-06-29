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
import type { BankMovement, BankMovementForm } from '../schemas/bank-movement.schema';
import { bankMovementsService, type BankMovementsQueryParams } from '../services/bank-movements-service';

interface PaginatedResponse {
  data: BankMovement[];
  meta: { page: number; limit: number; totalCount: number; totalPages: number };
}

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Se produjo un error';
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

export function useBankMovementsQuery(
  filters: BankMovementsQueryParams,
  enabled = true,
): UseQueryResult<PaginatedResponse> {
  return useQuery({
    queryKey: bankMovementsKeys.list(filters),
    queryFn: () => bankMovementsService.getAll(filters),
    enabled,
  });
}

export function useBankMovementQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: bankMovementsKeys.detail(id),
    queryFn: () => bankMovementsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useCreateBankMovementMutation(): UseMutationResult<any, unknown, BankMovementForm> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => bankMovementsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento bancario creado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useUpdateBankMovementMutation(): UseMutationResult<any, unknown, { id: string; data: Partial<BankMovementForm> }> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, data }) => bankMovementsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento bancario actualizado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useDeleteBankMovementMutation(): UseMutationResult<any, unknown, string> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => bankMovementsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento bancario eliminado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useReconcileMutation(): UseMutationResult<any, unknown, { id: string; payload: { internalRecordType: string; internalRecordId: string } }> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }) => bankMovementsService.reconcile(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento vinculado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useUnlinkMutation(): UseMutationResult<any, unknown, string> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => bankMovementsService.unlink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento desvinculado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useReverseMutation(): UseMutationResult<any, unknown, { id: string; payload: { valueDate: string; reason?: string } }> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }) => bankMovementsService.reverse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankMovementsKeys.all });
      toastSuccess('Movimiento reversado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
