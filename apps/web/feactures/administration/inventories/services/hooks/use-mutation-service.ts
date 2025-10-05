import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteService,
  saveServiceAction,
} from '../actions/service-actions';
import { Service } from '../schemas/service.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de servicios
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useServiceMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Service) => saveServiceAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.services.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.services.listAll() 
      });
      toast.success('Servicio guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el servicio');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un servicio
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.services.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.services.listAll() 
      });
      toast.success('Servicio eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'Service not found') {
          toast.error('Error, Servicio no encontrado');
        } else {
          toast.error('Error al eliminar el servicio');
        }
      }
    },
  });
}
