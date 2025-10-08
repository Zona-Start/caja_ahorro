import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reverseMovementAction } from '../actions/bank-movement-actions';

export const useReverseMovement = () => {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: reverseMovementAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankMovements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      toast.success('Movimiento reversado con éxito.');
    },
    onError: () => {
      toast.error('Ocurrió un error al reversar el movimiento.');
    },
  });
};
