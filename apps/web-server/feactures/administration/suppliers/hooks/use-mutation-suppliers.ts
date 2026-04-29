'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteSupplierAction,
  saveSupplierAction,
} from '../actions/suppliers-actions';
import { Supplier } from '../schemas/suppliers.schema';

/**
 * Hook para la mutación (crear/actualizar) de proveedores
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useSupplierMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: Supplier) => saveSupplierAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.list(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.suppliers.detail(data.data.id),
        });
      }

      toast.success('Proveedor guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el proveedor');
    },
  });
}

/**
 * Hook para eliminar un proveedor
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteSupplierMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteSupplierAction(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(id),
      });
      toast.crud.delete.success('Proveedor');
    },
    onError: () => {
      toast.crud.delete.error('Proveedor');
    },
  });
}
