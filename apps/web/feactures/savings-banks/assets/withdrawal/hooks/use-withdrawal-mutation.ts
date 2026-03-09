'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import {
  aprobeWithdrawalAction,
  createWithdrawalAction,
  deleteWithdrawalAction,
  disburseWithdrawalAction,
} from '../actions/withdrawal-actions';
import { Withdrawal } from '../schemas/withdrawal.schema';

// Mutation hook remains the same
export function useWithdrawalMutation(): UseMutationResult<any, Error, Withdrawal, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (withdrawal: Withdrawal) => createWithdrawalAction(withdrawal),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForWithdrawal.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawalTypes.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.withdrawals.detail(data.id),
        });
      }

      //toast.success('Retiro guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el retiro');
    },
  });
}

export function useAprobeWithdrawalMutation(): UseMutationResult<any, Error, number, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => aprobeWithdrawalAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForWithdrawal.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawalTypes.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.detail(id),
      });
      toast.success('Retiro aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar el retiro');
    },
  });
}

export function useDeleteWithdrawalMutation(): UseMutationResult<any, Error, number, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteWithdrawalAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForWithdrawal.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawalTypes.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.detail(id),
      });
      toast.crud.delete.success('Retiro');
    },
    onError: () => {
      toast.crud.delete.error('Retiro');
    },
  });
}

export function useDisburseWithdrawalMutation(): UseMutationResult<any, Error, { id: number; payload: any }, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      disburseWithdrawalAction(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.detail(id),
      });
      toast.success('Retiro desembolsado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al desembolsar el retiro');
    },
  });
}
