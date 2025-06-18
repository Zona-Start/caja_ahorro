'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSettlementAction } from '../actions/settlement-actions';
import { Settlement } from '../schemas/settlement.schema';
import { useSettlementStore } from '../store/settlementStore';

// Mutation hook remains the same
export function useSettlementMutation() {
  const queryClient = useQueryClient();
  const { selectedAssociate } = useSettlementStore();

  const mutation = useMutation({
    mutationFn: (settlement: Settlement) => saveSettlementAction(settlement),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['settlement'],
      });
      queryClient.removeQueries({
        queryKey: ['settlement-associate', selectedAssociate?.cedula],
      });
    },
  });

  return mutation;
}

// export function useDeleteWithdrawal() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => deleteWithdrawalAction(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['withdrawal'] });
//       toast.success('Retiro eliminado exitosamente');
//     },
//     onError: (error) => {
//       toast.error('Error al eliminar el retiro');
//       console.error('Error:', error);
//     },
//   });
// }
