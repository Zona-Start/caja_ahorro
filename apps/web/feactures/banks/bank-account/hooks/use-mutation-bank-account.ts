'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteBankAccountAction,
  saveBankAccountAction,
} from '../actions/bank-account-actions';
import { BankAccount } from '../schemas/bank-account.schema';

// Mutation hook remains the same
export function useBankAccountMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (bankAccount: BankAccount) =>
      saveBankAccountAction(bankAccount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account-by-id'] });
      toast.success('Cuenta Bancaria guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la cuenta bancaria');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBankAccountAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      toast.success('Cuenta Bancaria eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la cuenta bancaria');
      console.error('Error:', error);
    },
  });
}
