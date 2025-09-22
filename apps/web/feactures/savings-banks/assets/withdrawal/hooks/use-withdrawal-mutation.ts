'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  aprobeWithdrawalAction,
  createWithdrawalAction,
  deleteWithdrawalAction,
} from '../actions/withdrawal-actions';
import { Withdrawal } from '../schemas/withdrawal.schema';

// Mutation hook remains the same
export function useWithdrawalMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (withdrawal: Withdrawal) => createWithdrawalAction(withdrawal),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['withdrawal'],
      });
      queryClient.removeQueries({
        queryKey: ['withdrawal-type'],
      });
      queryClient.removeQueries({
        queryKey: ['withdrawal-associate-individual'],
      });
    },
  });

  return mutation;
}

export function useAprobeWithdrawalMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => aprobeWithdrawalAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['withdrawal'],
      });
      queryClient.removeQueries({
        queryKey: ['withdrawal-type'],
      });
      queryClient.removeQueries({
        queryKey: ['withdrawal-associate-individual'],
      });
      toast.success('Retiro aprobado exitosamente');
    },
    onError: (error) => {
      toast.error('Error no se aprobo el retiro contacte al adminsitrador');
      console.error('Error:', error);
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
      toast.success('Retiro anulado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el retiro');
      console.error('Error:', error);
    },
  });
}
