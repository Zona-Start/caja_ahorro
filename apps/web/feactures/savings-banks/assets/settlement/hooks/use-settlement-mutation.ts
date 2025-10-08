'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approveSettlementAction,
  saveSettlementAction,
} from '../actions/settlement-actions';
import { Settlement } from '../schemas/settlement.schema';

// Mutation hook remains the same
export function useSettlementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (settlement: Settlement) => saveSettlementAction(settlement),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForSettlement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
    },
    onError: () => {
      toast.error('Error al guardar la liquidación');
    },
  });
}

export function useApproveSettlementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => approveSettlementAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.all(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.associates.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.creditManagements.all(),
      });
      toast.success('Liquidación aprobada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar la liquidación');
    },
  });
}
