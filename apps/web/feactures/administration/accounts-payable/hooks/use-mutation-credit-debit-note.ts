'use client';

import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCreditDebitNoteAction } from '../actions/credit-debit-note.actions';
import { CreditDebitNote } from '../schemas/credit-debit-note.schema';

/**
 * Hook para crear notas de crédito o débito a cuenta por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useCreditDebitNoteMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreditDebitNote) => createCreditDebitNoteAction(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.detail(
          data?.accountsPayableId ?? 0,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.appliedTransactions(
          data?.accountsPayableId ?? 0,
        ),
      });
      toast.success('Nota de crédito/débito creada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la nota de crédito/débito');
    },
  });

  return mutation;
}
