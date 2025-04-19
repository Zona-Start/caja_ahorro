'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteAccountPlanAction,
  saveAccountPlanAction,
} from '../actions/account-plan-actions';
import { AccountPlan } from '../schemas/account-plan.schema';

export const ACCOUNTING_ACCOUNTS_KEY = ['accounting_accounts'];
export const PAGINATED_ACCOUNTS_KEY = ['paginated_accounts'];


// Mutation hook remains the same
export function useAccountPlanMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AccountPlan) => saveAccountPlanAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_ACCOUNTS_KEY });
      toast.success('Cuenta contable guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar la cuenta contable');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteAccountPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAccountPlanAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_ACCOUNTS_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_ACCOUNTS_KEY });
      toast.success('Cuenta contable eliminada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar la cuenta contable');
      console.error('Error:', error);
    },
  });
}
