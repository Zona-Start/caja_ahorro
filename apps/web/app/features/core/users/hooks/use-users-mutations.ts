import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { User, UserMutation } from '../schemas/users.schema';
import { usersService } from '../services/users-service';

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

export function useSaveUserMutation(): UseMutationResult<
  User,
  unknown,
  UserMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => usersService.save(payload),
    onSuccess: (user, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.users.detail(user?.id || ''),
      });

      toast({
        title: variables.id ? 'Usuario actualizado' : 'Usuario creado',
        description: variables.id
          ? 'Los datos del usuario se actualizaron correctamente.'
          : 'El usuario fue creado correctamente.',
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

export function useDeleteUserMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => usersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      toast({
        title: 'Usuario eliminado',
        description: 'El usuario fue eliminado correctamente.',
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

export function useManagePermissionsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      userId,
      permissionIds,
      tenantId,
    }: {
      userId: string;
      permissionIds: string[];
      tenantId?: string;
    }) => usersService.managePermissions(userId, permissionIds, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.all });
      toast({
        title: 'Permisos actualizados',
        description: 'Los permisos del usuario se actualizaron correctamente.',
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
