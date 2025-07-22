'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteSupplierInvoiceAction,
  saveSupplierInvoiceAction,
} from '../actions/supplier-invoice-actions';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';

export function useSupplierInvoiceMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: SupplierInvoice) => saveSupplierInvoiceAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices-by-id'] });
      toast.success('Factura de proveedor guardada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Invoice with number')) {
          toast.error('Error, La factura de proveedor con ese número ya existe');
        } else {
          toast.error(
            'Error al crear la factura de proveedor, contacte al administrador',
          );
        }
      }
    },
  });

  return mutation;
}

export function useDeleteSupplierInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierInvoiceAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices-by-id'] });
      toast.success('Factura de proveedor eliminada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('Error, La factura de proveedor no existe');
        } else {
          toast.error(
            'Error al eliminar la factura de proveedor, contacte al administrador',
          );
        }
      }
    },
  });
}
