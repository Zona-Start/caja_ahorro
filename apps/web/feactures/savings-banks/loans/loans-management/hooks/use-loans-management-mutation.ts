'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  aprobeLoanManagementAction,
  createLoanManagementAction,
  deleteLoanManagementAction,
} from '../actions/loans-management-actions';
import { LoanManagement } from '../schemas/loans-management.schema';

/**
 * Hook para crear un nuevo préstamo
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useLoanManagementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (loanManagement: LoanManagement) =>
      createLoanManagementAction(loanManagement),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.count(),
      });
      //toast.success('Préstamo creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear el préstamo, contacte al administrador');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para aprobar un préstamo
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAprobedLoanMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (id: number) => aprobeLoanManagementAction(id),
    onSuccess: (_, id) => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.count(),
      });
      toast.success('Préstamo aprobado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al aprobar el préstamo, contacte al administrador');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un préstamo
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteLoan() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteLoanManagementAction(id),
    onSuccess: (_, id) => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.count(),
      });
      toast.success('Préstamo cancelado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al cancelar el préstamo, contacte al administrador');
      console.error('Error:', error);
    },
  });
}
