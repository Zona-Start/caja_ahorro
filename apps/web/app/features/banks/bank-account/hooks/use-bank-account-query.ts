import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { bankAccountKeys } from '../keys/bank-account-keys';
import type {
  BankAccountForm,
  BankAccount,
} from '../schemas/bank-account.schema';
import type { BalancesByCurrency } from '../schemas/bank-account-response-api';
import {
  bankAccountService,
  type BankAccountQueryParams,
} from '../services/bank-account-service';

interface BankAccountsPaginatedResponse {
  data: BankAccount[];
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

export function useBankAccountsQuery(
  params: BankAccountQueryParams,
): UseQueryResult<BankAccountsPaginatedResponse> {
  return useQuery({
    queryKey: bankAccountKeys.list(params),
    queryFn: () => bankAccountService.getAllPaginated(params),
  });
}

export function useBankAccountQuery(
  id: string,
  enabled = true,
): UseQueryResult<{ data: BankAccount }> {
  return useQuery({
    queryKey: bankAccountKeys.detail(id),
    queryFn: () => bankAccountService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useBankAccountBalancesByCurrency(): UseQueryResult<{
  data: BalancesByCurrency[];
}> {
  return useQuery({
    queryKey: bankAccountKeys.balances(),
    queryFn: () => bankAccountService.getBalancesByCurrency(),
  });
}

export function useCreateBankAccountMutation(): UseMutationResult<
  unknown,
  unknown,
  BankAccountForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => bankAccountService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
      toastSuccess('Cuenta bancaria creada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useUpdateBankAccountMutation(): UseMutationResult<
  unknown,
  unknown,
  { id: string; data: Partial<BankAccountForm> }
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, data }) => bankAccountService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
      toastSuccess('Cuenta bancaria actualizada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useDeleteBankAccountMutation(): UseMutationResult<
  unknown,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => bankAccountService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
      toastSuccess('Cuenta bancaria eliminada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useBankAccountAll(): UseQueryResult<{
  data: { id: string; accountName: string | null; accountNumber: string }[];
}> {
  return useQuery({
    queryKey: bankAccountKeys.all,
    queryFn: async () => {
      const response = await bankAccountService.getAllPaginated({
        page: 1,
        limit: 500,
      });
      return {
        data: (response.data || []).map((item: BankAccount) => ({
          id: item.id,
          accountName: item.accountName || null,
          accountNumber: item.accountNumber,
        })),
      };
    },
  });
}

export function useBankAccountAllQuery(): UseQueryResult<{
  data: { id: string; accountName: string | null; accountNumber: string }[];
}> {
  return useBankAccountAll();
}
