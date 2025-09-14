'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  aprobeCreditManagementAction,
  createCreditManagementAction,
  deleteCreditManagementAction,
} from '../actions/credits-management-actions';
import { CreditManagement } from '../schemas/credits-management.schema';

// Mutation hook remains the same
export function useCreditManagementMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (creditManagement: CreditManagement) =>
      createCreditManagementAction(creditManagement),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ['credit-associates-individual-by-cedula'],
      });
      queryClient.invalidateQueries({ queryKey: ['credit-management'] });
      queryClient.invalidateQueries({ queryKey: ['credit-management-count'] });
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useAprobedCreditMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: number) => aprobeCreditManagementAction(id),
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: ['credit-associates-individual-by-cedula'],
      });
      queryClient.invalidateQueries({ queryKey: ['credit-management'] });
      queryClient.invalidateQueries({ queryKey: ['credit-management-count'] });
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCreditManagementAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-management'] });
      queryClient.invalidateQueries({ queryKey: ['credit-management-count'] });
      toast.success('Crédito eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el crédito');
      console.error('Error:', error);
    },
  });
}
