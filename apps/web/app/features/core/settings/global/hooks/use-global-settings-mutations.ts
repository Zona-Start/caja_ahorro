import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { GlobalSettingMutation, GlobalSetting } from '../schemas/global-settings.schema';
import { globalSettingsService } from '../services/global-settings-service';

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

export function useSaveGlobalSettingMutation(): UseMutationResult<
  GlobalSetting,
  unknown,
  GlobalSettingMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => globalSettingsService.save(payload),
    onSuccess: (setting, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalSettings.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.globalSettings.detail(setting.id),
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

export function useDeleteGlobalSettingMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => globalSettingsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.globalSettings.all });
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