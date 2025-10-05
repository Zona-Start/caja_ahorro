'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteAccountPlanAction,
  saveAccountPlanAction,
} from '../actions/account-plan-actions';
import { AccountPlan } from '../schemas/account-plan.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de planes de cuentas
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAccountPlanMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AccountPlan) => saveAccountPlanAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountingAccounts.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountingAccounts.paginated() 
      });
      toast.success('Cuenta contable guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la cuenta contable');
      console.error('Error:', error);
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

  return useMutation({
    mutationFn: (id: number) => deleteAccountPlanAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountingAccounts.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountingAccounts.paginated() 
      });
      toast.success('Cuenta contable eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la cuenta contable');
      console.error('Error:', error);
    },
  });
}
