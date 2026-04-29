'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cancelPaymentBatchAction,
  confirmPaymentBatchAction,
  createPaymentBatchAction,
  markAsUploadedAction,
} from '../actions/payment-batch-actions';
import {
  ConfirmPaymentBatch,
  CreatePaymentBatch,
} from '../schemas/payment-batch.schema';

export function useCreatePaymentBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (dto: CreatePaymentBatch) => createPaymentBatchAction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatchSources.all(),
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
        queryKey: queryKeys.paymentBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatches.detail(id),
      });
      toast.success('Lote de pago marcado como subido');
    },
    onError: () => {
      toast.error('Error al marcar el lote como subido');
    },
  });
}

export function useConfirmPaymentBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ConfirmPaymentBatch }) =>
      confirmPaymentBatchAction(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatches.detail(id),
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

export function useCancelPaymentBatchMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => cancelPaymentBatchAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatches.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatches.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.paymentBatchSources.all(),
      });
      toast.success('Lote de pago anulado exitosamente');
    },
    onError: () => {
      toast.error('Error al anular el lote de pago');
    },
  });
}
