'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteWithdrawalTypesAction,
  saveWithdrawalTypesAction,
} from '../actions/withdrawal-types-actions';
import { WithdrawalTypes } from '../schemas/withdrawal-types.schema';

// Mutation hook
export function useWithdrawalTypesMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: WithdrawalTypes) => saveWithdrawalTypesAction(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawalTypes.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.withdrawalTypes.detail(data.id),
        });
      }

      toast.success('Tipo de Retiro guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el tipo de retiro');
    },
  });
}

export function useDeleteWithdrawalTypesMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteWithdrawalTypesAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawalTypes.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawalTypes.detail(id),
      });
      toast.crud.delete.success('Tipo de Retiro');
    },
    onError: () => {
      toast.crud.delete.error('Tipo de Retiro');
    },
  });
}
