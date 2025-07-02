'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteLoanManagementAction,
  saveLoanManagementAction,
} from '../actions/loans-management-actions';
import { LoanManagement } from '../schemas/loans-management.schema';

// Mutation hook remains the same
export function useLoanManagementMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (loanManagement: LoanManagement) =>
      saveLoanManagementAction(loanManagement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-management'] });
      queryClient.removeQueries({ queryKey: ['loans-associates-by-cedula'] });
      queryClient.invalidateQueries({ queryKey: ['loan-management-count'] });
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteLoanManagementAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-management'] });
      queryClient.invalidateQueries({ queryKey: ['loan-management-count'] });
      toast.success('Prestamo cancelado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al cancelar el prestamo');
      console.error('Error:', error);
    },
  });
}
