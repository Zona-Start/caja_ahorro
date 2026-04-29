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
      if (
        error instanceof Error &&
        error.message ===
          'A cycle with OPEN or PENDING status already exists in the given date range.'
      ) {
        toast.crud.create.error(
          'Ya existe un ciclo contable abierto en ese período.',
        );
        return;
      } else if (
        error instanceof Error &&
        error.message === 'An OPEN cycle already exists.'
      ) {
        toast.crud.update.error('Ya existe un ciclo ABIERTO.');
      } else {
        toast.error('Error, Contacte al Administrador');
        console.error('Nuevo Error:', error.message);
      }
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
