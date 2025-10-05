'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  accountForSupplierInvoiceAction,
  createSupplierInvoiceAction,
  deleteSupplierInvoiceAction,
  updateSupplierInvoiceAction,
} from '../actions/supplier-invoice-actions';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar/contabilizar) de facturas de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSupplierInvoiceMutation() {
  const queryClient = useQueryClient();
  let toastMessage: string;
  const mutation = useMutation({
    mutationFn: (data: Partial<SupplierInvoice>) => {
      toastMessage =
        data.status !== 'ACCOUNTED_FOR'
          ? 'Factura de proveedor guardada exitosamente'
          : 'Factura de proveedor contabilizada exitosamente';
      if (data.id && data.status !== 'ACCOUNTED_FOR') {
        return updateSupplierInvoiceAction(data);
      } else if (data.id && data.status === 'ACCOUNTED_FOR') {
        return accountForSupplierInvoiceAction(data);
      }
      return createSupplierInvoiceAction(data);
    },
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplierInvoices.all() 
      });
      // Invalidar todos los detalles de facturas
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices-by-id'] });
      toast.success(toastMessage);
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Invoice with number')) {
          toast.error(
            'Error, La factura de proveedor con ese número ya existe',
          );
        } else {
          toast.error(
            error.message ||
              'Error al guardar la factura de proveedor, contacte al administrador',
          );
        }
      }
    },
  });

  return mutation;
}

/**
 * Hook para anular/cancelar una factura de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useCancelSupplierInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierInvoiceAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.supplierInvoices.all() 
      });
      // Invalidar todos los detalles de facturas
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices-by-id'] });
      toast.success('Factura de proveedor anulada exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          toast.error('Error, La factura de proveedor no existe');
        } else {
          toast.error(
            error.message ||
              'Error al anular la factura de proveedor, contacte al administrador',
          );
        }
      }
    },
  });
}
