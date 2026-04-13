'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approveSettlementAction,
  disburseSettlementAction,
  saveSettlementAction,
} from '../actions/settlement-actions';
import { Settlement } from '../schemas/settlement.schema';
import { DisburseSettlementFormData } from '../schemas/disburse-settlement.schema';

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

export function useDisburseSettlementMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: number;
      formData: DisburseSettlementFormData;
    }) => disburseSettlementAction(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankMovements.all(),
      });
      toast.success('Desembolso procesado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al procesar el desembolso');
    },
  });
}
