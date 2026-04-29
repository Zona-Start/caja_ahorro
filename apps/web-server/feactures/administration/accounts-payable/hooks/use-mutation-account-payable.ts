'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authorizeAccountPayableAction,
  createAdvancePaymentAction,
  deleteAccountPayableAction,
  payAccountPayableAction,
} from '../actions/account-payable-actions';
import { authorizeAdavancePaymentAction } from '../actions/manager-documents-action';
import { AdvancePayment } from '../schemas/advance-payment.schema';
import { PayAccountPayable } from '../schemas/pay-account-payable.schema';

/**
 * Hook para autorizar pago a una cuenta por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAuthorizeAccountPayableMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => authorizeAccountPayableAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.paymentHistory(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.appliedTransactions(id),
      });
      toast.success('Cuenta por pagar autorizado pago exitosamente');
    },
    onError: (error) => {
      toast.error('Error al autorizar la cuenta por pagar');
    },
  });
}

/**
 * Hook para procesar pagos de cuentas por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function usePayAccountPayableMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: PayAccountPayable) => payAccountPayableAction(data),
    onSuccess: (_, data) => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.detail(data.accountsPayableId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.paymentHistory(
          data.accountsPayableId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.appliedTransactions(
          data.accountsPayableId,
        ),
      });
      toast.success('Pago procesado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al procesar el pago');
    },
  });
}

/**
 * Hook para crear anticipos/pagos adelantados
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAdvancePaymentMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: AdvancePayment) => createAdvancePaymentAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.advances(),
      });
      toast.success('Anticipo registrado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al registrar el anticipo');
    },
  });
}

/**
 * Hook para anular/eliminar una cuenta por pagar
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteAccountPayable() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteAccountPayableAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.paymentHistory(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountsPayable.appliedTransactions(id),
      });
      toast.crud.delete.success('Cuenta por pagar');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.crud.delete.error('Cuenta por pagar no existe');
        } else {
          toast.error(
            'Error al eliminar la cuenta por pagar, contacte al administrador',
          );
        }
      }
    },
  });
}

/**
 * Hook para autorizar pago a un anticipo
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useAuthorizeAdvancePaymentMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => authorizeAdavancePaymentAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierTransactions.advances(),
      });
      toast.success('Anticipo autorizado a pagar exitosamente');
    },
    onError: (error) => {
      toast.error('Error al autorizar el pago del anticipo');
    },
  });
}
