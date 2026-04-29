'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteFixedAsset,
  saveFixedAssetAction,
} from '../actions/fixed-asset-actions';
import { FixedAsset } from '../schemas/fixed-asset.schema';

/**
 * Hook para la mutación (crear/actualizar) de activos fijos
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useFixedAssetMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (data: FixedAsset) => saveFixedAssetAction(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fixedAssets.all(),
      });

      if (data?.data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.fixedAssets.detail(data.data.id),
        });
      }

      toast.success('Activo fijo guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el activo fijo');
    },
  });
}

/**
 * Hook para eliminar un activo fijo
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteFixedAssetMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteFixedAsset(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fixedAssets.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.fixedAssets.detail(id),
      });
      toast.crud.delete.success('Activo fijo');
    },
    onError: () => {
      toast.crud.delete.error('Activo fijo');
    },
  });
}
