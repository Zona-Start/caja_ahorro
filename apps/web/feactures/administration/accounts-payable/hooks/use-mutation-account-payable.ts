'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAdvancePaymentAction,
  deleteAccountPayableAction,
  payAccountPayableAction,
  saveAccountPayableAction,
} from '../actions/account-payable-actions';
import { AccountPayable } from '../schemas/account-payable.schema';
import { AdvancePayment } from '../schemas/advance-payment.schema';
import { PayAccountPayable } from '../schemas/pay-account-payable.schema';

export function useAccountPayableMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: AccountPayable) => saveAccountPayableAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable-by-id'] });
      toast.success('Cuenta por pagar guardada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          toast.error('Error, La cuenta por pagar para esta factura ya existe');
        } else {
          toast.error(
            'Error al crear la cuenta por pagar, contacte al administrador',
          );
        }
      }
    },
  });

  return mutation;
}

export function usePayAccountPayableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PayAccountPayable) => payAccountPayableAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Pago procesado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al procesar el pago');
    },
  });
}

export function useAdvancePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdvancePayment) => createAdvancePaymentAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Anticipo registrado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al registrar el anticipo');
    },
  });
}

export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAccountPayableAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable-by-id'] });
      toast.success('Cuenta por pagar eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('Error, La cuenta por pagar no existe');
        } else {
          toast.error(
            'Error al eliminar la cuenta por pagar, contacte al administrador',
          );
        }
      }
    },
  });
}
