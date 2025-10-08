'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteBankAccountAction,
  saveBankAccountAction,
} from '../actions/bank-account-actions';
import { BankAccount } from '../schemas/bank-account.schema';

// Mutation hook remains the same
export function useBankAccountMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (bankAccount: BankAccount) =>
      saveBankAccountAction(bankAccount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.list(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bankAccounts.detail(data.data.id),
        });
      }

      toast.success('Cuenta Bancaria guardada exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar la cuenta bancaria');
    },
  });
}

export function useDeleteBankAccountMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteBankAccountAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.detail(id),
      });
      toast.crud.delete.success('Cuenta Bancaria');
    },
    onError: () => {
      toast.crud.delete.error('Cuenta Bancaria');
    },
  });
}
