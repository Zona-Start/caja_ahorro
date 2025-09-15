'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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

  return useMutation({
    mutationFn: (dto: CreatePaymentBatch) => createPaymentBatchAction(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-batches'] });
      toast.success('Lote de pago creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear el lote de pago');
    },
  });
}

export function useMarkAsUploadedMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => markAsUploadedAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-batches'] });
      queryClient.invalidateQueries({ queryKey: ['payment-batch-details'] });
      toast.success('Lote de pago marcado como subido');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al marcar el lote como subido');
    },
  });
}

export function useConfirmPaymentBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: ConfirmPaymentBatch }) =>
      confirmPaymentBatchAction(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-batches'] });
      queryClient.invalidateQueries({ queryKey: ['payment-batch-details'] });
      toast.success('Lote de pago confirmado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al confirmar el lote de pago');
    },
  });
}

export function useCancelPaymentBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelPaymentBatchAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-batches'] });
      queryClient.invalidateQueries({ queryKey: ['payment-batch-details'] });
      toast.success('Lote de pago anulado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al anular el lote de pago');
    },
  });
}
