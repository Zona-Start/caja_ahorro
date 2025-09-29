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

export const ACCOUNTING_ENTRIES_KEY = ['accounting_entries'];
export const PAGINATED_ACCOUNTING_ENTRIES_KEY = ['paginated_accounting_entries'];

const invalidateQueries = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: ACCOUNTING_ENTRIES_KEY });
  queryClient.invalidateQueries({ queryKey: PAGINATED_ACCOUNTING_ENTRIES_KEY });
};

export function useAccountingEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccountingEntry) => saveAccountingEntryAction(data),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Asiento contable guardado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar el asiento contable');
    },
  });
}

export function useDeleteAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAccountingEntryAction(id),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Asiento contable eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el asiento contable');
    },
  });
}

export function useSubmitAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submitAccountingEntryAction(id),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Asiento contable enviado para aprobación');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al enviar el asiento contable');
    },
  });
}

export function usePostAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => postAccountingEntryAction(id),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Asiento contable contabilizado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al contabilizar el asiento');
    },
  });
}

export function useCancelAccountingEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelAccountingEntryAction(id),
    onSuccess: () => {
      invalidateQueries(queryClient);
      toast.success('Asiento contable anulado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al anular el asiento contable');
    },
  });
}
