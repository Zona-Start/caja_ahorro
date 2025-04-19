'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteTransactionTypeAction,
  saveTransactionTypeAction,
} from '../actions/transaction-type-actions';
import { TransactionType } from '../schemas/transaction-type.schema';

export const TRANSACTION_TYPE_KEY = ['transaction-type'];
export const PAGINATED_TRANSACTION_TYPE_KEY = ['paginated-transaction-type'];


// Mutation hook
export function useTransactionTypeMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: TransactionType) => saveTransactionTypeAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_TYPE_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_TRANSACTION_TYPE_KEY });
      toast.success('Tipo de Transación guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el tipo de transación');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteTransactionType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTransactionTypeAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_TYPE_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_TRANSACTION_TYPE_KEY });
      toast.success('Tipo de Transación eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el tipo de transación');
      console.error('Error:', error);
    },
  });
}
