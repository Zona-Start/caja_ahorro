import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type {
  ExpenseReportForm,
  PayReportForm,
} from '../schemas/expense-reports.schema';
import {
  expenseReportsService,
  type ExpenseReportsQueryParams,
} from '../services/expense-reports-service';

export const expenseReportsKeys = {
  all: ['expense-reports'] as const,
  lists: () => [...expenseReportsKeys.all, 'list'] as const,
  list: (filters: object) => [...expenseReportsKeys.lists(), filters] as const,
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

export function useExpenseReportsQuery(params: ExpenseReportsQueryParams) {
  return useQuery({
    queryKey: expenseReportsKeys.list(params),
    queryFn: () => expenseReportsService.getAllPaginated(params),
  });
}

export function useCreateExpenseReportMutation(): UseMutationResult<
  unknown,
  unknown,
  ExpenseReportForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => expenseReportsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseReportsKeys.all });
      toastSuccess('Reporte de reembolso creado: pendiente de aprobación');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useReportActionMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; action: 'approve' | 'reject'; reason?: string }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, action, reason }) =>
      action === 'approve'
        ? expenseReportsService.approve(id)
        : expenseReportsService.reject(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: expenseReportsKeys.all });
      toastSuccess(
        variables.action === 'approve'
          ? 'Reporte aprobado: pasa a la cola de pagos'
          : 'Reporte rechazado',
      );
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function usePayExpenseReportMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; payload: PayReportForm }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }) => expenseReportsService.pay(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseReportsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['petty-cash'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toastSuccess('Reembolso pagado y gasto generado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
