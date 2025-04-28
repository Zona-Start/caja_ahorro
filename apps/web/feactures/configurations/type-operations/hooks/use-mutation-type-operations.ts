'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteTypeOperationsAction,
  saveTypeOperationsAction,
} from '../actions/type-operations-actions';
import { TypeOperations } from '../schemas/type-operations.schema';

export const TYPE_OPERATIONS_KEY = ['type-operations'];
export const PAGINATED_TYPE_OPERATIONS_KEY = ['paginated-type-operations'];

// Mutation hook
export function useTypeOperationsMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TypeOperations) => saveTypeOperationsAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_OPERATIONS_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_OPERATIONS_KEY,
      });
      toast.success('Tipo de Transación guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de transación');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteTypeOperations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTypeOperationsAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TYPE_OPERATIONS_KEY });
      queryClient.invalidateQueries({
        queryKey: PAGINATED_TYPE_OPERATIONS_KEY,
      });
      toast.success('Tipo de Operación eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de operación');
      console.error('Error:', error);
    },
  });
}
