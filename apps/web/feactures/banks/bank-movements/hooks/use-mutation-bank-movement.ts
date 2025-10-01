'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  saveBankMovementAction,
  deleteBankMovementAction,
} from '../actions/bank-movement-actions';
import { BankMovement } from '../schemas/bank-movement.schema';

export const BANK_MOVEMENTS_KEY = ['bank_movements'];
export const PAGINATED_BANK_MOVEMENTS_KEY = ['paginated_bank_movements'];

const invalidateQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: BANK_MOVEMENTS_KEY });
  queryClient.invalidateQueries({ queryKey: PAGINATED_BANK_MOVEMENTS_KEY });
};

export function useBankMovementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BankMovement) => saveBankMovementAction(data),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Movimiento bancario guardado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar el movimiento bancario');
    },
  });
}

export function useDeleteBankMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBankMovementAction(id),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Movimiento bancario eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el movimiento bancario');
    },
  });
}
