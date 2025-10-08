import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAndReconcileMovementAction } from '../actions/bank-movement-actions';
import { BankMovement } from '../schemas/bank-movement.schema';

export const useCreateBankMovement = () => {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: BankMovement) => createAndReconcileMovementAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankMovements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.withdrawals.list(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.loansManagement.list(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.loansPaid.list(),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.list(),
      });

      toast.success('Movimiento bancario creado con éxito.');
    },
    onError: () => {
      toast.error('Ocurrió un error al crear el movimiento.');
    },
  });
};
