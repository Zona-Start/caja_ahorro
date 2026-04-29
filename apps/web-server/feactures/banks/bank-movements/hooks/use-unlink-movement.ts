import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unlinkMovementAction } from '../actions/bank-movement-actions';

export const useUnlinkMovement = () => {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: unlinkMovementAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bankMovements.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      toast.success('Movimiento desvinculado con éxito.');
    },
    onError: () => {
      toast.error('Ocurrió un error al desvincular el movimiento.');
    },
  });
};
