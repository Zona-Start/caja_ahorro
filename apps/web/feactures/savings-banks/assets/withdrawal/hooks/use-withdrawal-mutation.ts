'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteWithdrawalAction,
  saveWithdrawalAction,
} from '../actions/withdrawal-actions';
import { Withdrawal } from '../schemas/withdrawal.schema';

// Mutation hook remains the same
export function useWithdrawalMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (withdrawal: Withdrawal) => saveWithdrawalAction(withdrawal),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['withdrawal'],
      });
      queryClient.removeQueries({
        queryKey: ['withdrawal-type'],
      });
      queryClient.removeQueries({
        queryKey: ['withdrawal-associate', ''],
      });
    },
  });

  return mutation;
}

export function useDeleteWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteWithdrawalAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal'] });
      toast.success('Retiro eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el retiro');
      console.error('Error:', error);
    },
  });
}
