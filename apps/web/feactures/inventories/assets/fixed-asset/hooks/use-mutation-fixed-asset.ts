import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteFixedAsset,
  saveFixedAssetAction,
} from '../actions/fixed-asset-actions';
import { FixedAsset } from '../schemas/fixed-asset.schema';

export function useFixedAssetMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FixedAsset) => saveFixedAssetAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-asset'] });
      toast.success('Bien guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el bien');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteFixedAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFixedAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixed-asset'] });
      toast.success('Bien  eliminado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al eliminar el bien');
      console.error('Error:', error);
    },
  });
}
