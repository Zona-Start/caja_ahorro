import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { TenantSettingMutation, TenantSetting } from '../schemas/tenant-settings.schema';
import { tenantSettingsService } from '../services/tenant-settings-service';

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

export function useUpdateTenantSettingMutation(): UseMutationResult<
  TenantSetting,
  unknown,
  { id: string; payload: Partial<TenantSettingMutation> }
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }) => tenantSettingsService.update(id, payload),
    onSuccess: (setting) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenantSettings.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tenantSettings.detail(setting.id),
      });

      toast({
        title: 'Parámetro actualizado',
        description: 'El parámetro se actualizó correctamente.',
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