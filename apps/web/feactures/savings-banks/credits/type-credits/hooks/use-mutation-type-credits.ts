'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteTypeCreditsAction,
  saveTypeCreditsAction,
} from '../actions/type-credits-actions';
import { TypeCredit } from '../schemas/type-credits.schema';

export const TYPE_CREDITS_KEY = ['type-credits'];
export const PAGINATED_TYPE_CREDITS_KEY = ['paginated-type-credits'];

// Mutation hook
export function useTypeCreditsMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TypeCredit) => saveTypeCreditsAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_CREDITS_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_CREDITS_KEY,
      });
      toast.success('Tipo de Crédito guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de transación');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteTypeCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTypeCreditsAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_CREDITS_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_CREDITS_KEY,
      });
      toast.success('Tipo de Crédito eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de crédito');
      console.error('Error:', error);
    },
  });
}
