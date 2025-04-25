'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteBankAction, saveBankAction } from '../actions/banks-actions';
import { Banks } from '../schemas/banks.schema';

export const BANKS_KEY = ['accounting_banks'];
export const PAGINATED_BANKS_KEY = ['paginated_banks'];

// Mutation hook mutation insert or update
export function useBankMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Banks) => saveBankAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANKS_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_BANKS_KEY });
      toast.success('Banco guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el banco');
      console.error('Error:', error);
    },
  });

  return mutation;
}

// Mutation hook delete
export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteBankAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANKS_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_BANKS_KEY });
      toast.success('Banco eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el banco');
      console.error('Error:', error);
    },
  });
}
