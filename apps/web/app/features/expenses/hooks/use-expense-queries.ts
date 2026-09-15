import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { cashRegistersKeys, expensesKeys } from '../keys/expenses-keys';
import type {
  ExpenseFilters,
  ExpenseForm,
  ExpenseMode,
} from '../schemas/expenses.schema';
import { expensesService } from '../services/expenses-service';

interface ExpensesPaginatedResponse {
  data: Array<Record<string, unknown> & { id: string }>;
  meta: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
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

export function useExpensesQuery(
  params: ExpenseFilters,
): UseQueryResult<ExpensesPaginatedResponse> {
  return useQuery({
    queryKey: expensesKeys.list(params),
    queryFn: () => expensesService.getAllPaginated(params),
  });
}

export function useExpenseModeQuery(): UseQueryResult<{ data: ExpenseMode }> {
  return useQuery({
    queryKey: expensesKeys.mode(),
    queryFn: () => expensesService.getMode(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExpenseMutation(): UseMutationResult<
  unknown,
  unknown,
  ExpenseForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => expensesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      toastSuccess('Gasto registrado: pendiente de aprobación');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useDeleteExpenseMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => expensesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      toastSuccess('Gasto eliminado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useExpenseConfigQuery(enabled = true): UseQueryResult<{
  data: {
    vatRate: number | null;
    islrRate: number | null;
    exchangeRates: Record<string, number | null>;
    exchangeRateDate: string;
  };
}> {
  return useQuery({
    queryKey: [...expensesKeys.all, 'config'],
    queryFn: () => expensesService.getConfig(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useApproveExpenseMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => expensesService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      // Invalida cajas/bancos/fondos porque la aprobación descuenta saldos
      queryClient.invalidateQueries({ queryKey: cashRegistersKeys.all });
      toastSuccess('Gasto aprobado y descontado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useRejectExpenseMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; reason?: string }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, reason }) => expensesService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      toastSuccess('Gasto rechazado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}
