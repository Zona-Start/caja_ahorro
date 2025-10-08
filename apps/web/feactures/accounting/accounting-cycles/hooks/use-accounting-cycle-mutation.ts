'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  closeAccountingCycleAction,
  saveAccountingCycleAction,
} from '../actions/accounting-cycle-actions';

/**
 * Hook para la mutación (crear/actualizar) de ciclos contables
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAccountingCycleMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: saveAccountingCycleAction,
    onSuccess: (_, variables) => {
      // 1.  Siempre invalida el total
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.all(),
      });

      // 2.  Invalida la página actual (si hay paginación activa)
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.paginated(),
      });

      // 3.  Si editaste, invalida ese detalle
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accountingCycles.detail(variables.id),
        });
      }
      toast.crud.create.success('Ciclo contable');
    },
    onError: (error) => {
      toast.crud.create.error('Ciclo contable');
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
  const toast = useToastSystem();

  return useMutation({
    mutationFn: closeAccountingCycleAction,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.paginated(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.detail(id),
      });
      toast.success('Ciclo contable cerrado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al cerrar el ciclo contable');
      console.error('Error:', error);
    },
  });
}
