import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  cashRegistersKeys,
  expensesKeys,
  pettyCashKeys,
} from '../keys/expenses-keys';
import type {
  Expense,
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

export interface ExpenseDetailLineResponse {
  id?: string;
  categoryId: string;
  categoryName?: string | null;
  description: string;
  amount: string;
  taxRate: string;
  taxAmount: string;
  isExempt: boolean;
}

export type ExpenseDetailResponse = Omit<Expense, 'details'> & {
  supplierName?: string | null;
  details?: ExpenseDetailLineResponse[];
};

export function useExpenseQuery(
  id: string,
  enabled = true,
): UseQueryResult<{ data: ExpenseDetailResponse }> {
  return useQuery({
    queryKey: expensesKeys.detail(id),
    queryFn: () => expensesService.getById(id),
    enabled: enabled && !!id,
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
      // Invalida cajas/bancos/fondos: la fuente puede afectarse
      queryClient.invalidateQueries({ queryKey: cashRegistersKeys.all });
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toastSuccess('Gasto aprobado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function usePayExpenseMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => expensesService.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expensesKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: pettyCashKeys.all });
      queryClient.invalidateQueries({ queryKey: cashRegistersKeys.all });
      toastSuccess('Pago registrado: el gasto pasó a Pagado');
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
