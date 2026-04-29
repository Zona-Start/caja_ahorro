'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBankAction, saveBankAction } from '../actions/banks-actions';
import { Banks } from '../schemas/banks.schema';

// Mutation hook mutation insert or update
export function useBankMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: Banks) => saveBankAction(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankDirectory.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.bankDirectory.detail(data.id),
        });
      }

      toast.success('Banco guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el banco');
    },
  });
}

// Mutation hook delete
export function useDeleteBankMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteBankAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankDirectory.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankDirectory.detail(id),
      });
      toast.crud.delete.success('Banco');
    },
    onError: () => {
      toast.crud.delete.error('Banco');
    },
  });
}
