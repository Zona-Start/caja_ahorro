'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveSettingSystemAction } from '../actions/system-properties-actions';
import { SettingSystem } from '../schemas/system-properties.schema';

// Mutation hook remains the same
export function useSettingSystemMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (data: SettingSystem) => saveSettingSystemAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.systemProperties.all(),
      });
      toast.success('Propiedad del sistema guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar la propiedad del sistema');
    },
  });

  return mutation;
}

// export function useDeleteSettingSystem() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: number) => deleteAccountPlanAction(id),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: SETTING_SYSTEM_KEY });
//       toast.success('Propiedad del sistema eliminada exitosamente');
//     },
//     onError: (error) => {
//       toast.error('Error al eliminar la propiedad del sistema');
//       console.error('Error:', error);
//     },
//   });
// }
