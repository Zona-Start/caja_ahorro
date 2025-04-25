'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteAssociatesAction,
  saveAssociateAction,
} from '../actions/ordinary-loans-actions';
import { AssociatesMutate } from '../schemas/ordinary-loans.schema';

// Mutation hook remains the same
export function useAssociateMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (associatesMutate: AssociatesMutate) =>
      saveAssociateAction(associatesMutate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associates'] });
      queryClient.invalidateQueries({ queryKey: ['associates-by-id'] });
      toast.success('Asociado guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el asociado');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteAssociate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAssociatesAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['associates'] });
      toast.success('Asociado eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el asociado');
      console.error('Error:', error);
    },
  });
}
