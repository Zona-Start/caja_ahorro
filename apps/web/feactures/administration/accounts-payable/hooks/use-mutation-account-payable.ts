'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAdvancePaymentAction,
  deleteAccountPayableAction,
  payAccountPayableAction,
} from '../actions/account-payable-actions';
import { AdvancePayment } from '../schemas/advance-payment.schema';
import { PayAccountPayable } from '../schemas/pay-account-payable.schema';

import { authorizeAccountPayableAction } from '../actions/account-payable-actions';

//Hook para crear una cuenta por pagar
// export function useAccountPayableMutation() {
//   const queryClient = useQueryClient();

//   const mutation = useMutation({
//     mutationFn: (data: AccountPayable) => saveAccountPayableAction(data),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
//       queryClient.invalidateQueries({ queryKey: ['accounts-payable-by-id'] });
//       toast.success('Cuenta por pagar guardada exitosamente');
//     },
//     onError: (error) => {
//       if (error instanceof Error) {
//         if (error.message.includes('already exists')) {
//           toast.error('Error, La cuenta por pagar para esta factura ya existe');
//         } else {
//           toast.error(
//             'Error al crear la cuenta por pagar, contacte al administrador',
//           );
//         }
//       }
//     },
//   });

//   return mutation;
// }

//hook para autorizar pago a una cuenta por pagar
export function useAuthorizeAccountPayableMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => authorizeAccountPayableAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      toast.success('Cuenta por pagar autorizado pago exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al autorizar la cuenta por pagar');
    },
  });
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

// hook para crear anticipos
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

//hooks para anular una cuenta por pagar
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
