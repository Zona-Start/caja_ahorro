import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { ModuleSettingMutation, ModuleSetting } from '../schemas/module-settings.schema';
import { moduleSettingsService } from '../services/module-settings-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Se produjo un error al ejecutar la operación';
};

export function useSaveModuleSettingMutation(): UseMutationResult<
  ModuleSetting,
  unknown,
  ModuleSettingMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => moduleSettingsService.save(payload),
    onSuccess: (setting, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleSettings.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.moduleSettings.detail(setting.id),
      });

      toast({
        title: variables.id ? 'Parámetro actualizado' : 'Parámetro creado',
        description: variables.id
          ? 'Los datos del parámetro se actualizaron correctamente.'
          : 'El parámetro fue creado correctamente.',
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

export function useDeleteModuleSettingMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => moduleSettingsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleSettings.all });
      toast({
        title: 'Parámetro eliminado',
        description: 'El parámetro fue eliminado correctamente.',
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