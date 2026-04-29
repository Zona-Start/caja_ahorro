'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteAccountPlanAction,
  saveAccountPlanAction,
} from '../actions/account-plan-actions';

/**
 * Hook para la mutación (crear/actualizar) de planes de cuentas
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAccountPlanMutation() {
  const queryClient = useQueryClient();

  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: saveAccountPlanAction,
    onSuccess: (_, variables) => {
      // 1.  Siempre invalida el total
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingAccounts.all(),
      });

      // 2.  Invalida la página actual (si hay paginación activa)
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingAccounts.paginated(),
      });

      // 3.  Si editaste, invalida ese detalle
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accountingAccounts.detail(variables.id),
        });
      }
      toast.crud.create.success('Cuenta contable');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.crud.create.error('Cuenta contable');
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un plan de cuenta
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteAccountPlan() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: deleteAccountPlanAction,
    onSuccess: (_, id) => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingAccounts.paginated(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingAccounts.detail(id),
      });
      toast.crud.delete.success('Cuenta contable');
    },
    onError: (error) => {
      toast.crud.delete.error('Cuenta contable');
      console.error('Error:', error);
    },
  });
}
