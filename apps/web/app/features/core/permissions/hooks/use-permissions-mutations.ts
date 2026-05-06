import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { PermissionMutation, Permission } from '../schemas/permissions.schema';
import { permissionsService } from '../services/permissions-service';

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

export function useSavePermissionMutation(): UseMutationResult<
  Permission,
  unknown,
  PermissionMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => permissionsService.save(payload),
    onSuccess: (permission, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.permissions.detail(permission.id),
      });

      toast({
        title: variables.id ? 'Permiso actualizado' : 'Permiso creado',
        description: variables.id
          ? 'Los datos del permiso se actualizaron correctamente.'
          : 'El permiso fue creado correctamente.',
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

export function useDeletePermissionMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => permissionsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      toast({
        title: 'Permiso eliminado',
        description: 'El permiso fue eliminado correctamente.',
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