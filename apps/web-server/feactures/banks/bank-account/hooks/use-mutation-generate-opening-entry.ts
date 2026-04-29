'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateOpeningEntryAction } from '../actions/bank-account-actions';

export const useGenerateOpeningEntry = () => {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        currentBalance: number;
        accountingRuleId: number;
        openingDate: string;
      };
    }) => generateOpeningEntryAction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankAccounts.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.list(),
      });
      toast.success('Asiento de apertura generado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al generar el asiento de apertura');
    },
  });
};
