'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteCreditPaidAction,
  saveCreditPaidAction,
} from '../actions/credits-paid-actions';
import { CreditPaid } from '../schemas/credits-paid.schema';

// Mutation hook remains the same
export function useCreditPaidMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (creditPaid: CreditPaid) => saveCreditPaidAction(creditPaid),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditsPaid.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForCreditsPaid.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });

      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.creditsPaid.detail(data.id),
        });
      }

      toast.success('Pago de Crédito guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el pago del crédito');
    },
  });
}

export function useDeleteCreditPaidMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteCreditPaidAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditsPaid.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForCreditsPaid.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditsPaid.detail(id),
      });
      toast.crud.delete.success('Pago de Crédito');
    },
    onError: () => {
      toast.crud.delete.error('Pago de Crédito');
    },
  });
}
