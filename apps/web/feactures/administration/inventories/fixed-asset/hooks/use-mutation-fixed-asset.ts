import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteFixedAsset,
  saveFixedAssetAction,
} from '../actions/fixed-asset-actions';
import { FixedAsset } from '../schemas/fixed-asset.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de activos fijos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useFixedAssetMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FixedAsset) => saveFixedAssetAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.fixedAssets.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.fixedAssets.listAll() 
      });
      toast.success('Bien guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el bien');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un activo fijo
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteFixedAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFixedAsset(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.fixedAssets.all() 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.fixedAssets.listAll() 
      });
      toast.success('Bien eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el bien');
      console.error('Error:', error);
    },
  });
}
