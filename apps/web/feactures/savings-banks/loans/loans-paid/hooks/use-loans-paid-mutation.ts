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
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (loanPaid: LoanPaid) => saveLoanPaidAction(loanPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['loan-paid'],
      });
      queryClient.removeQueries({
        queryKey: ['loan-paid-associate-individul-by-cedula'],
      });
      queryClient.invalidateQueries({
        queryKey: ['loan-management'],
      });
      queryClient.invalidateQueries({
        queryKey: ['loan-management-count'],
      });
    },
  });

  return mutation;
}

export function useDeleteLoanPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLoanPaidAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-paid-associate'] });
      queryClient.invalidateQueries({ queryKey: ['loan-paid'] });
      toast.success('Pago de Préstamo Anulado exitosamente');
    },
    onError: (error) => {
      if (error.message === 'The payment was not found.') {
        toast.error('No se encontró el pago.');
      } else if (error.message === 'This payment has already been cancelled.') {
        toast.error('Este pago ya ha sido cancelado.');
      } else {
        toast.error('Error al anular el pago del prestamo');
        console.error('Error:', error);
      }
    },
  });
}
