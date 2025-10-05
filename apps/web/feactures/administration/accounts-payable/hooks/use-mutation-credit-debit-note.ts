'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createCreditDebitNoteAction } from '../actions/credit-debit-note.actions';
import { CreditDebitNote } from '../schemas/credit-debit-note.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para crear notas de crédito o débito a cuenta por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useCreditDebitNoteMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreditDebitNote) => createCreditDebitNoteAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountsPayable.all() 
      });
      toast.success('Nota de crédito/débito creada exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear la nota de crédito/débito');
    },
  });

  return mutation;
}
