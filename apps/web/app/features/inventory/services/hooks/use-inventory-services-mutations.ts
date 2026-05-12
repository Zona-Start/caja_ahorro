import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { inventoryServicesService } from '../services/inventory-services-service';
import type { InventoryService } from '../schemas/inventory-services.schema';

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Ocurrió un error inesperado'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado';
};

export function useInventoryServiceMutation(): UseMutationResult<
  InventoryService,
  unknown,
  InventoryService
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: InventoryService) =>
      payload.id
        ? inventoryServicesService.update(payload)
        : inventoryServicesService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventoryServices.all,
      });
      toast({
        title: variables.id ? 'Servicio actualizado' : 'Servicio creado',
        description: variables.id
          ? 'El servicio de inventario ha sido actualizado exitosamente.'
          : 'El servicio de inventario ha sido creado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteInventoryServiceMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => inventoryServicesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventoryServices.all,
      });
      toast({
        title: 'Servicio eliminado',
        description:
          'El servicio de inventario ha sido eliminado exitosamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}
