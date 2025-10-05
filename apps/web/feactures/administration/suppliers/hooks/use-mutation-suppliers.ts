'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteSupplierAction,
  saveSupplierAction,
} from '../actions/suppliers-actions';
import { Supplier } from '../schemas/suppliers.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de proveedores
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSupplierMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Supplier) => saveSupplierAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.suppliers.all() 
      });
      // Invalidar todos los detalles de proveedores
      queryClient.invalidateQueries({ queryKey: ['supplier-by-id'] });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.suppliers.count() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.suppliers.listAll() 
      });
      toast.success('Proveedor guardado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Supplier with code')) {
          toast.error('Error, El proveedor con ese código ya existe');
        } else if (error.message.includes('Supplier with tax ID')) {
          toast.error('Error, El proveedor con ese RIF ya existe');
        } else {
          toast.error('Error al crear el proveedor, contacte al administrador');
        }
      }
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierAction(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.suppliers.all() 
      });
      // Invalidar todos los detalles de proveedores
      queryClient.invalidateQueries({ queryKey: ['supplier-by-id'] });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.suppliers.count() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.suppliers.listAll() 
      });
      toast.success('Proveedor eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message.includes('Suppliers not found')) {
          toast.error('Error, El proveedor no existe');
        } else if (
          error.message.includes(
            'Cannot be deleted, has invoices in the system',
          )
        ) {
          toast.error(
            'Error, El proveedor no se puede eliminar, tiene facturas en el sistema.',
          );
        } else if (
          error.message.includes(
            'Cannot be deleted, has puschase orders in the system',
          )
        ) {
          toast.error(
            'Error, El proveedor no se puede eliminar, tiene órdenes de compra en el sistema.',
          );
        } else {
          toast.error(
            'Error al eliminar el proveedor, contacte al administrador',
          );
        }
      }
    },
  });
}
