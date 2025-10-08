'use client';

import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToastSystem } from '@/hooks/use-toast-system';
import {
  cancelAccountingEntryAction,
  deleteAccountingEntryAction,
  postAccountingEntryAction,
  saveAccountingEntryAction,
  submitAccountingEntryAction,
} from '../actions/accounting-entry-actions';

/**
 * Hook para la mutación (crear/actualizar) de asientos contables
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAccountingEntryMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();
  return useMutation({
    mutationFn: saveAccountingEntryAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.paginated(),
      });

      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accountingEntries.detail(variables.id),
        });
      }
      toast.crud.create.success('Asiento contable');
    },
    onError: (error) => {
      toast.crud.create.error('Asiento contable');
    },
  });
}

/**
 * Hook para eliminar un asiento contable
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteAccountingEntry() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();
  return useMutation({
    mutationFn: deleteAccountingEntryAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.paginated(),
      });
      toast.crud.delete.success('Asiento contable');
    },
    onError: (error) => {
      toast.crud.delete.error('Asiento contable');
    },
  });
}

/**
 * Hook para enviar un asiento contable para aprobación
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSubmitAccountingEntry() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();
  return useMutation({
    mutationFn: submitAccountingEntryAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.paginated(),
      });
      toast.success('Asiento contable enviado para aprobación');
    },
    onError: (error) => {
      toast.error('Error al enviar el asiento contable');
    },
  });
}

/**
 * Hook para contabilizar un asiento contable (postearlo al libro mayor)
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePostAccountingEntry() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();
  return useMutation({
    mutationFn: postAccountingEntryAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.paginated(),
      });
      toast.success('Asiento contable contabilizado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al contabilizar el asiento');
    },
  });
}

/**
 * Hook para anular/cancelar un asiento contable
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useCancelAccountingEntry() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();
  return useMutation({
    mutationFn: (id: number) => cancelAccountingEntryAction(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.paginated(),
      });
      toast.success('Asiento contable anulado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al anular el asiento contable');
    },
  });
}
