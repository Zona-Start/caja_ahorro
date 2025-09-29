
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  closeAccountingCycleAction,
  saveAccountingCycleAction,
} from '../actions/accounting-cycle-actions';
import { AccountingCycle } from '../schemas/accounting-cycle.schema';

export const ACCOUNTING_CYCLES_KEY = ['accounting_cycles'];
export const PAGINATED_ACCOUNTING_CYCLES_KEY = ['paginated_accounting_cycles'];


export function useAccountingCycleMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AccountingCycle) => saveAccountingCycleAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTING_CYCLES_KEY });
      queryClient.invalidateQueries({ queryKey: PAGINATED_ACCOUNTING_CYCLES_KEY });
      toast.success('Ciclo contable guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el ciclo contable');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useCloseAccountingCycle() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (id: number) => closeAccountingCycleAction(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ACCOUNTING_CYCLES_KEY });
        queryClient.invalidateQueries({ queryKey: PAGINATED_ACCOUNTING_CYCLES_KEY });
        toast.success('Ciclo contable cerrado exitosamente');
      },
      onError: (error) => {
        toast.error('Error al cerrar el ciclo contable');
        console.error('Error:', error);
      },
    });
  }
