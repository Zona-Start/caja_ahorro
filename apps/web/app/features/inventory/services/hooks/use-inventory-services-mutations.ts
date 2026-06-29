import { QUERY_KEYS } from '@/lib/query-keys';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { inventoryServicesService } from '../services/inventory-services-service';
import type { InventoryService } from '../schemas/inventory-services.schema';

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) return error.response?.data?.message || error.message || 'Ocurrió un error inesperado';
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
};

export function useInventoryServiceMutation(): UseMutationResult<any, unknown, any> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { _suppliers, currencyCode, purchaseExchangeRate, createdAt, updatedAt, ...rest } = payload;
      const result = rest.id
        ? await inventoryServicesService.update(rest as InventoryService)
        : await inventoryServicesService.create(rest as InventoryService);

      const serviceId = result?.id ?? rest.id;
      if (serviceId && _suppliers !== undefined) {
        if (rest.id) {
          const existing = await apiClient.get(`/inventory/product-service-suppliers?serviceId=${serviceId}`);
          const items = Array.isArray(existing.data?.data) ? existing.data.data : Array.isArray(existing.data) ? existing.data : [];
          for (const item of items) {
            if (item.id) await apiClient.delete(`/inventory/product-service-suppliers/${item.id}`);
          }
        }
        for (const s of _suppliers) {
          await apiClient.post('/inventory/product-service-suppliers', {
            serviceId,
            suppliersId: s.suppliersId,
            leadTimeDays: s.leadTimeDays,
          });
        }
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryServices.all });
      toast({
        title: variables.id ? 'Servicio actualizado' : 'Servicio creado',
        description: variables.id ? 'El servicio ha sido actualizado.' : 'El servicio ha sido creado.',
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: getErrorMessage(error), variant: 'destructive' });
    },
  });
}

export function useDeleteInventoryServiceMutation(): UseMutationResult<any, unknown, string> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => inventoryServicesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventoryServices.all });
      toast({ title: 'Servicio eliminado', description: 'El servicio ha sido eliminado.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: getErrorMessage(error), variant: 'destructive' });
    },
  });
}
