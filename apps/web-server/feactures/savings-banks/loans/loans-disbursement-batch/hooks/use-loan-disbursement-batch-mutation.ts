'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cancelLoanDisbursementBatchAction,
  confirmLoanDisbursementBatchAction,
  createLoanDisbursementBatchAction,
  markAsUploadedAction,
} from '../actions/loan-disbursement-batch-actions';
import {
  ConfirmLoanDisbursementBatch,
  CreateLoanDisbursementBatch,
} from '../schemas/loan-disbursement-batch.schema';

export function useCreateLoanDisbursementBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (dto: CreateLoanDisbursementBatch) => createLoanDisbursementBatchAction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatchSources.all(),
      });
      toast.success('Lote de pago creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el lote de pago');
    },
  });
}

export function useMarkAsUploadedMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => markAsUploadedAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.detail(id),
      });
      toast.success('Lote de pago marcado como subido');
    },
    onError: () => {
      toast.error('Error al marcar el lote como subido');
    },
  });
}

export function useConfirmLoanDisbursementBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ConfirmLoanDisbursementBatch }) =>
      confirmLoanDisbursementBatchAction(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      toast.success('Lote de pago confirmado exitosamente');
    },
    onError: () => {
      toast.error('Error al confirmar el lote de pago');
    },
  });
}

export function useCancelLoanDisbursementBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => cancelLoanDisbursementBatchAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatches.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.loanDisbursementBatchSources.all(),
      });
      toast.success('Lote de pago anulado exitosamente');
    },
    onError: () => {
      toast.error('Error al anular el lote de pago');
    },
  });
}
