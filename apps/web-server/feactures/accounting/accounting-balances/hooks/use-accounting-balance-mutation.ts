'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bootstrappingAction,
  bootstrappingWithFileAction,
  closeCycleAction,
  openCycleAction,
} from '../actions/accounting-balance-actions';
import { CloseCycle } from '../schemas/accounting-balance.schema';

export function useBootstrappingMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: bootstrappingAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingBalances.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingBalances.paginated(),
      });
      toast.crud.create.success('Carga inicial de balances');
    },
    onError: (error) => {
      console.error('Error:', error);
      if (error instanceof Error) {
        toast.crud.create.error(error.message.toString());
      } else {
        toast.crud.create.error('Carga inicial de balances');
      }
    },
  });
}

export function useBootstrappingWithFileMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: bootstrappingWithFileAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingBalances.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingBalances.paginated(),
      });
      toast.crud.create.success('Carga inicial de balances desde Excel');
    },
    onError: (error) => {
      console.error('Error:', error.message);
      toast.crud.create.error('Carga inicial de balances desde Excel');
    },
  });
}

export function useCloseCycleMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({
      cycleId,
      payload,
    }: {
      cycleId: number;
      payload: CloseCycle;
    }) => closeCycleAction(cycleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingBalances.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.all(),
      });
      toast.success('Ciclo contable cerrado exitosamente');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Error al cerrar el ciclo contable');
    },
  });
}

export function useOpenCycleMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: openCycleAction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingBalances.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingCycles.all(),
      });
      toast.success('Nuevo ciclo contable abierto exitosamente');
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error('Error al abrir el nuevo ciclo contable');
    },
  });
}
