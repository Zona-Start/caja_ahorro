import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { cashRegistersKeys } from '../keys/expenses-keys';
import type { CashRegisterForm } from '../schemas/cash-registers.schema';
import {
  cashRegistersService,
  type CashRegisterQueryParams,
} from '../services/cash-registers-service';

interface CashRegistersPaginatedResponse {
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

export function useCashRegistersQuery(
  params: CashRegisterQueryParams,
): UseQueryResult<CashRegistersPaginatedResponse> {
  return useQuery({
    queryKey: cashRegistersKeys.list(params),
    queryFn: () => cashRegistersService.getAllPaginated(params),
  });
}

export function useCashRegistersAll(): UseQueryResult<{
  data: Array<{ id: string; name: string; isActive: boolean }>;
}> {
  return useQuery({
    queryKey: cashRegistersKeys.all,
    queryFn: async () => {
      const response = await cashRegistersService.getAll();
      return { data: response.data || [] };
    },
  });
}

export function useActiveSession(
  cashRegisterId: string,
  enabled = true,
): UseQueryResult<{
  data: {
    register: { id: string; name: string };
    session: {
      id: string;
      status: string;
      systemExpectedBalance: string;
    } | null;
  };
}> {
  return useQuery({
    queryKey: cashRegistersKeys.activeSession(cashRegisterId),
    queryFn: () => cashRegistersService.getActiveSession(cashRegisterId),
    enabled: enabled && !!cashRegisterId,
  });
}

export function useCreateCashRegisterMutation(): UseMutationResult<
  unknown,
  unknown,
  CashRegisterForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => cashRegistersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashRegistersKeys.all });
      toastSuccess('Caja registradora creada correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useOpenSessionMutation(): UseMutationResult<
  unknown,
  unknown,
  { cashRegisterId: string; initialBalance: number }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => cashRegistersService.openSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashRegistersKeys.all });
      toastSuccess('Sesión de caja abierta correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}

export function useCloseSessionMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; actualPhysicalBalance: number }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, actualPhysicalBalance }) =>
      cashRegistersService.closeSession(id, { actualPhysicalBalance }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashRegistersKeys.all });
      toastSuccess('Sesión de caja cerrada correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
