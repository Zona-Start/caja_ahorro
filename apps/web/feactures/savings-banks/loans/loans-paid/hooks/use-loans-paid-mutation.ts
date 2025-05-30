'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteLoanPaidAction,
  saveLoanPaidAction,
} from '../actions/loans-paid-actions';
import { LoanPaid } from '../schemas/loans-paid.schema';

// Mutation hook remains the same
export function useLoanPaidMutation() {
  const mutation = useMutation({
    mutationFn: (loanPaid: LoanPaid) => saveLoanPaidAction(loanPaid),
  });

  return mutation;
}

export function useDeleteLoanPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLoanPaidAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-paid-associate'] });
      toast.success('Pago de Préstamo eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el pago del prestamo');
      console.error('Error:', error);
    },
  });
}
