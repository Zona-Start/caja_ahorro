'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { saveSettingSystemAction } from '../actions/system-properties-actions';
import { SettingSystem } from '../schemas/system-properties.schema';

export const SETTING_SYSTEM_KEY = ['setting-system'];

// Mutation hook remains the same
export function useSettingSystemMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: SettingSystem) => saveSettingSystemAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTING_SYSTEM_KEY });
      toast.success('Propiedad del sistema guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar la propiedad del sistema');
      console.error('Error:', error);
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
