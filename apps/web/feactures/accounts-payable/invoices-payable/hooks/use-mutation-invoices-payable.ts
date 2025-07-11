'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteInvoicesPayableAction,
  saveInvoicesPayableAction,
} from '../actions/invoices-payable-actions';
import { InvoicesPayable } from '../schemas/invoices-payable.schema';

// Mutation hook remains the same
export function useInvoicesPayableMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: InvoicesPayable) => saveInvoicesPayableAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-payable'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-payable-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-payable-count'] });
      toast.success('Factura guardada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Invoice with number')) {
          toast.error('Error, La factura con ese número ya existe');
        } else {
          toast.error('Error al crear la factura, contacte al administrador');
        }
      }
    },
  });

  return mutation;
}

export function useDeleteInvoicesPayable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteInvoicesPayableAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices-payable'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-payable-by-id'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-payable-count'] });
      toast.success('Factura eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Invoice not found')) {
          toast.error('Error, La factura no existe');
        } else {
          toast.error(
            'Error al eliminar la factura, contacte al administrador',
          );
        }
      }
    },
  });
}
