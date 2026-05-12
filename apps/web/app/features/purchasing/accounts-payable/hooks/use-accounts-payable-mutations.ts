import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { accountsPayableKeys } from '../keys/accounts-payable-keys';
import type { AccountsPayableApi } from '../schemas/accounts-payable-api.schema';
import { accountsPayableService } from '../services/accounts-payable-service';

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

export function useAuthorizeAccountsPayableMutation(): UseMutationResult<
  AccountsPayableApi,
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => accountsPayableService.authorize(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountsPayableKeys.all });
      toastSuccess('Cuenta por pagar autorizada correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}
