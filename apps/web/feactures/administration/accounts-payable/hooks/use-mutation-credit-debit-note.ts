'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCreditDebitNoteAction } from '../actions/credit-debit-note.actions';
import { CreditDebitNote } from '../schemas/credit-debit-note.schema';

// hook para crear notas de credito o debito a cuenta por pagar
export function useCreditDebitNoteMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreditDebitNote) => createCreditDebitNoteAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Nota de crédito/débito creada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la nota de crédito/débito');
    },
  });

  return mutation;
}
