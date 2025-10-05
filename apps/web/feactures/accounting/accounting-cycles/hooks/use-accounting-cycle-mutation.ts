
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  closeAccountingCycleAction,
  saveAccountingCycleAction,
} from '../actions/accounting-cycle-actions';
import { AccountingCycle } from '../schemas/accounting-cycle.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de ciclos contables
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAccountingCycleMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AccountingCycle) => saveAccountingCycleAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountingCycles.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.accountingCycles.paginated() 
      });
      toast.success('Ciclo contable guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el ciclo contable');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para cerrar un ciclo contable
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useCloseAccountingCycle() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (id: number) => closeAccountingCycleAction(id),
      onSuccess: () => {
        // ✅ Invalidación robusta usando la fábrica de claves
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.accountingCycles.all() 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.accountingCycles.paginated() 
        });
        toast.success('Ciclo contable cerrado exitosamente');
      },
      onError: (error) => {
        toast.error('Error al cerrar el ciclo contable');
        console.error('Error:', error);
      },
    });
  }
