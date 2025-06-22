'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteCreditPaidAction,
  saveCreditPaidAction,
} from '../actions/credits-paid-actions';
import { CreditPaid } from '../schemas/credits-paid.schema';

// Mutation hook remains the same
export function useCreditPaidMutation() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (creditPaid: CreditPaid) => saveCreditPaidAction(creditPaid),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ['credit-paid-associate-individual-by-cedula'],
      });
      queryClient.invalidateQueries({
        queryKey: ['credit-paid'],
      });
    },
  });

  return mutation;
}

export function useDeleteCreditPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCreditPaidAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-paid-associate'] });
      toast.success('Pago de Crédito eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el pago del crédito');
      console.error('Error:', error);
    },
  });
}
