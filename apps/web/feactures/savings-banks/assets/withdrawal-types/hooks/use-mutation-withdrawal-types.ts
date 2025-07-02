'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteWithdrawalTypesAction,
  saveWithdrawalTypesAction,
} from '../actions/withdrawal-types-actions';
import { WithdrawalTypes } from '../schemas/withdrawal-types.schema';

// Mutation hook
export function useWithdrawalTypesMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: WithdrawalTypes) => saveWithdrawalTypesAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-types'] });
      toast.success('Tipo de Rétiro guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de rétiro');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteWithdrawalTypes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWithdrawalTypesAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-types'] });
      toast.success('Tipo de Rétiro eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de rétiro');
      console.error('Error:', error);
    },
  });
}
