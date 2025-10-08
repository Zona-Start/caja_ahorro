'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  aprobeCreditManagementAction,
  createCreditManagementAction,
  deleteCreditManagementAction,
} from '../actions/credits-management-actions';
import { CreditManagement } from '../schemas/credits-management.schema';

// Mutation hook remains the same
export function useCreditManagementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (creditManagement: CreditManagement) =>
      createCreditManagementAction(creditManagement),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditManagements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForCreditManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.creditManagements.detail(Number(data?.id)),
        });
      }

      //toast.success('Crédito guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el crédito');
    },
  });
}

export function useAprobedCreditMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => aprobeCreditManagementAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditManagements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForCreditManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditManagements.detail(id),
      });
      toast.success('Crédito aprobado exitosamente');
    },
    onError: () => {
      toast.error('Error al aprobar el crédito');
    },
  });
}

export function useDeleteCreditMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteCreditManagementAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditManagements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForCreditManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditManagements.detail(id),
      });
      toast.crud.delete.success('Crédito');
    },
    onError: () => {
      toast.crud.delete.error('Crédito');
    },
  });
}
