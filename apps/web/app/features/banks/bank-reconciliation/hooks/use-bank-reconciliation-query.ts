import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { bankReconciliationKeys } from '../keys/bank-reconciliation-keys';
import type {
  BankReconciliation,
  BankReconciliationForm,
  BankMovementManualForm,
  BankTransaction,
} from '../schemas/bank-reconciliation.schema';
import {
  bankReconciliationService,
  type BankReconciliationQueryParams,
} from '../services/bank-reconciliation-service';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
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
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

export function useBankReconciliationsQuery(
  params: BankReconciliationQueryParams,
): UseQueryResult<PaginatedResponse<BankReconciliation>> {
  return useQuery({
    queryKey: bankReconciliationKeys.list(params),
    queryFn: () => bankReconciliationService.getAllPaginated(params),
  });
}

export function useBankReconciliationQuery(
  id: string,
  enabled = true,
): UseQueryResult<{ data: BankReconciliation & { details: unknown[]; transactions: BankTransaction[] } }> {
  return useQuery({
    queryKey: bankReconciliationKeys.detail(id),
    queryFn: () => bankReconciliationService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useAvailableTransactionsQuery(
  reconciliationId: string,
  enabled = true,
): UseQueryResult<{ data: BankTransaction[] }> {
  return useQuery({
    queryKey: bankReconciliationKeys.transactions(reconciliationId),
    queryFn: () =>
      bankReconciliationService.getAvailableTransactions(reconciliationId),
    enabled: enabled && !!reconciliationId,
  });
}

export function useCreateBankReconciliationMutation(): UseMutationResult<
  unknown,
  unknown,
  BankReconciliationForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => bankReconciliationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.all,
      });
      toastSuccess('Conciliación creada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useProcessReconciliationMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => bankReconciliationService.processAndComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.all,
      });
      toastSuccess('Conciliación procesada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useCancelReconciliationMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => bankReconciliationService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.all,
      });
      toastSuccess('Conciliación cancelada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useAddManualMovementMutation(): UseMutationResult<
  unknown,
  unknown,
  { reconciliationId: string; payload: BankMovementManualForm }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ reconciliationId, payload }) =>
      bankReconciliationService.addManualMovement(reconciliationId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.detail(variables.reconciliationId),
      });
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.all,
      });
      toastSuccess('Movimiento agregado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useAddBulkMovementsMutation(): UseMutationResult<
  unknown,
  unknown,
  { reconciliationId: string; movementIds: string[] }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ reconciliationId, movementIds }) =>
      bankReconciliationService.addBulkMovements(reconciliationId, movementIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.detail(variables.reconciliationId),
      });
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.all,
      });
      toastSuccess('Movimientos agregados correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useUploadExcelMutation(): UseMutationResult<
  unknown,
  unknown,
  FormData
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (formData) => bankReconciliationService.uploadExcel(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bankReconciliationKeys.all,
      });
      toastSuccess(
        'Conciliación creada desde Excel y movimientos importados correctamente',
      );
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}
