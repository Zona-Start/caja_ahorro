'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteService,
  saveServiceAction,
} from '../actions/service-actions';
import { Service } from '../schemas/service.schema';

/**
 * Hook para la mutación (crear/actualizar) de servicios
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: Service) => saveServiceAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.all(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.services.detail(data.data.id),
        });
      }

      toast.success('Servicio guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el servicio');
    },
  });
}

/**
 * Hook para eliminar un servicio
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.services.detail(id),
      });
      toast.crud.delete.success('Servicio');
    },
    onError: () => {
      toast.crud.delete.error('Servicio');
    },
  });
}
