'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createBankConciliationInitialAction } from '../actions/initial-reconciliation.action';
import { InitialReconciliation } from '../schemas/bank-conciliation-initial.schema';

export const useInitialReconciliation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (initialReconciliation: InitialReconciliation) =>
      createBankConciliationInitialAction(initialReconciliation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-account'] });
      queryClient.invalidateQueries({ queryKey: ['bank-account-by-id'] });
      toast.success('Conciliacion Inicial creada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear la conciliacion inicial');
      console.error('Error:', error);
    },
  });

  return mutation;
};
