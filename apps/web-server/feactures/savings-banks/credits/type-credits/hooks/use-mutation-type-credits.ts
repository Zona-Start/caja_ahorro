'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteTypeCreditsAction,
  saveTypeCreditsAction,
} from '../actions/type-credits-actions';
import { TypeCredit } from '../schemas/type-credits.schema';

// Mutation hook
export function useTypeCreditsMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: TypeCredit) => saveTypeCreditsAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.typeCredits.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.typeCredits.list(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.typeCredits.allList(),
      });

      toast.success('Tipo de Crédito guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el tipo de crédito');
    },
  });
}

export function useDeleteTypeCreditsMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteTypeCreditsAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.typeCredits.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.typeCredits.list(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.typeCredits.allList(),
      });
      toast.crud.delete.success('Tipo de Crédito');
    },
    onError: () => {
      toast.crud.delete.error('Tipo de Crédito');
    },
  });
}
