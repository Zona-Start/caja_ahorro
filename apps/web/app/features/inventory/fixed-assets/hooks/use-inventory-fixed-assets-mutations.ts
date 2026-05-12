import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { inventoryFixedAssetsService } from '../services/inventory-fixed-assets-service';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';

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

export function useInventoryFixedAssetMutation(): UseMutationResult<
  InventoryFixedAsset,
  unknown,
  InventoryFixedAsset
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: InventoryFixedAsset) =>
      payload.id
        ? inventoryFixedAssetsService.update(payload)
        : inventoryFixedAssetsService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventoryFixedAssets.all,
      });
      toast({
        title: variables.id
          ? 'Activo fijo actualizado'
          : 'Activo fijo creado',
        description: variables.id
          ? 'El activo fijo ha sido actualizado exitosamente.'
          : 'El activo fijo ha sido creado exitosamente.',
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

export function useDeleteInventoryFixedAssetMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => inventoryFixedAssetsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.inventoryFixedAssets.all,
      });
      toast({
        title: 'Activo fijo eliminado',
        description:
          'El activo fijo ha sido eliminado exitosamente.',
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
