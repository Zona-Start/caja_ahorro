'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  saveAccountingEntryAction,
  deleteAccountingEntryAction,
  submitAccountingEntryAction,
  postAccountingEntryAction,
  cancelAccountingEntryAction,
} from '../actions/accounting-entry-actions';
import { AccountingEntry } from '../schemas/accounting-entry.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Función helper para invalidar todas las queries relacionadas con asientos contables
 * Utiliza la fábrica centralizada de claves para garantizar consistencia
 */
const invalidateQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.accountingEntries.all() });
  queryClient.invalidateQueries({ queryKey: queryKeys.accountingEntries.paginated() });
};

/**
 * Hook para la mutación (crear/actualizar) de asientos contables
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAccountingEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountingEntry) => saveAccountingEntryAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando helper centralizado
      invalidateQueries(queryClient);
      toast.success('Asiento contable guardado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar el asiento contable');
    },
  });
}

/**
 * Hook para eliminar un asiento contable
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccountingEntryAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando helper centralizado
      invalidateQueries(queryClient);
      toast.success('Asiento contable eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el asiento contable');
    },
  });
}

/**
 * Hook para enviar un asiento contable para aprobación
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSubmitAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submitAccountingEntryAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando helper centralizado
      invalidateQueries(queryClient);
      toast.success('Asiento contable enviado para aprobación');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar el asiento contable');
    },
  });
}

/**
 * Hook para contabilizar un asiento contable (postearlo al libro mayor)
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePostAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postAccountingEntryAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando helper centralizado
      invalidateQueries(queryClient);
      toast.success('Asiento contable contabilizado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al contabilizar el asiento');
    },
  });
}

/**
 * Hook para anular/cancelar un asiento contable
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useCancelAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelAccountingEntryAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando helper centralizado
      invalidateQueries(queryClient);
      toast.success('Asiento contable anulado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al anular el asiento contable');
    },
  });
}
