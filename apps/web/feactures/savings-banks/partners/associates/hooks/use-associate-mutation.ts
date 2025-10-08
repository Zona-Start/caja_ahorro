'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteAssociatesAction,
  saveAssociateAction,
} from '../actions/associates-actions';
import { AssociatesMutate } from '../schemas/associates.schema';

// Mutation hook remains the same
export function useAssociateMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (associatesMutate: AssociatesMutate) =>
      saveAssociateAction(associatesMutate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.associates.all() });
      toast.success('Asociado guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el asociado');
    },
  });

  return mutation;
}

export function useDeleteAssociate() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteAssociatesAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.associates.all() });
      toast.success('Asociado eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (
          error.message ===
          'The partner cannot be deleted because there are transactions in their account other than the opening transaction.'
        ) {
          toast.error(
            'No se puede eliminar el asociado posee movimientos en su cuenta',
          );
        } else if (
          error.message ===
          'You cannot delete a retired or archived partner because they are part of your history.'
        ) {
          toast.error(
            'No se puede eliminar asociado retirado o archivado porque es parte del histórico.',
          );
        } else {
          toast.error('Error al inhabilitar el asociado');
        }
      }
    },
  });
}
