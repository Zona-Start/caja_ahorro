'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  accountForSupplierInvoiceAction,
  createSupplierInvoiceAction,
  deleteSupplierInvoiceAction,
  updateSupplierInvoiceAction,
} from '../actions/supplier-invoice-actions';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';

/**
 * Hook para la mutación (crear/actualizar/contabilizar) de facturas de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSupplierInvoiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: Partial<SupplierInvoice>) => {
      if (data.id && data.status !== 'ACCOUNTED_FOR') {
        return updateSupplierInvoiceAction(data);
      } else if (data.id && data.status === 'ACCOUNTED_FOR') {
        return accountForSupplierInvoiceAction(data);
      }
      return createSupplierInvoiceAction(data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierInvoices.all(),
      });

      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.supplierInvoices.detail(variables.id),
        });
      }

      const toastMessage =
        variables.status !== 'ACCOUNTED_FOR'
          ? 'Factura de proveedor guardada exitosamente'
          : 'Factura de proveedor contabilizada exitosamente';

      toast.success(toastMessage);
    },
    onError: (error, variables) => {
      const toastMessage =
        variables.status !== 'ACCOUNTED_FOR'
          ? 'Error al guardar la factura de proveedor'
          : 'Error al contabilizar la factura de proveedor';
      toast.error(toastMessage);
    },
  });
}

/**
 * Hook para anular/cancelar una factura de proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteSupplierInvoice() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierInvoiceAction(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierInvoices.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.supplierInvoices.detail(id),
      });
      toast.crud.delete.success('Factura de proveedor');
    },
    onError: () => {
      toast.crud.delete.error('Factura de proveedor');
    },
  });
}
