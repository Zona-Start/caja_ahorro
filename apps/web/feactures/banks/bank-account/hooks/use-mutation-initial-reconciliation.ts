'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBankConciliationInitialAction } from '../actions/initial-reconciliation.action';
import { InitialReconciliation } from '../schemas/bank-conciliation-initial.schema';

export const useInitialReconciliation = () => {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (initialReconciliation: InitialReconciliation) =>
      createBankConciliationInitialAction(initialReconciliation),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.list(),
      });
      toast.success('Conciliación inicial creada exitosamente');
    },
    onError: () => {
      toast.error('Error al crear la conciliación inicial');
    },
  });
};
