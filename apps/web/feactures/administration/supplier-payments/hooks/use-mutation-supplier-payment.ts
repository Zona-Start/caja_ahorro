
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createSupplierPaymentAction,
  updateSupplierPaymentAction,
  validateSupplierPaymentAction,
  approveSupplierPaymentAction,
  executeSupplierPaymentAction,
  reverseSupplierPaymentAction,
} from '../actions';
import { SupplierPayment } from '../schemas';

export function useSupplierPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<SupplierPayment>) => {
      if (data.id) {
        return updateSupplierPaymentAction(data);
      }
      return createSupplierPaymentAction(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payment'] });
      toast.success('Pago a proveedor guardado exitosamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar el pago');
    },
  });
}

function createStatusMutation(action: Function, successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => action(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-payments'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-payment'] });
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(error.message || 'Ocurrió un error');
    },
  });
}

export const useValidateSupplierPayment = () => createStatusMutation(validateSupplierPaymentAction, 'Pago validado exitosamente');
export const useApproveSupplierPayment = () => createStatusMutation(approveSupplierPaymentAction, 'Pago aprobado exitosamente');
export const useExecuteSupplierPayment = () => createStatusMutation(executeSupplierPaymentAction, 'Pago ejecutado exitosamente');
export const useReverseSupplierPayment = () => createStatusMutation(reverseSupplierPaymentAction, 'Pago anulado exitosamente');
