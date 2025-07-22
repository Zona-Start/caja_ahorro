import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteService,
  saveServiceAction,
} from '../actions/service-actions';
import { Service } from '../schemas/service.schema';

export function useServiceMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Service) => saveServiceAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services-all'] });
      toast.success('Servicio guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el servicio');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services-all'] });
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
