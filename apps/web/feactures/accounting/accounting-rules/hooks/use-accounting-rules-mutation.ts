'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteAccountingRuleAction,
  saveAccountingRuleAction,
} from '../actions/accounting-rules-actions';

export function useAccountingRuleMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: saveAccountingRuleAction,
    onSuccess: (_, variables) => {
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingRules.all(),
      });

      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accountingRules.detail(variables.id),
        });
      }
      toast.crud.create.success('Regla contable');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.crud.create.error('Regla contable');
    },
  });

  return mutation;
}

export function useDeleteAccountingRule() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: deleteAccountingRuleAction,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingRules.all(),
      });
      toast.crud.delete.success('Regla contable');
    },
    onError: (error) => {
      toast.crud.delete.error('Regla contable');
      console.error('Error:', error);
    },
  });
}
