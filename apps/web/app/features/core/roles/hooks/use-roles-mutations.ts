import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { Role, RoleMutation } from '../schemas/roles.schema';
import { rolesService } from '../services/roles-service';

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

export function useSaveRoleMutation(): UseMutationResult<
  Role,
  unknown,
  RoleMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => rolesService.save(payload),
    onSuccess: (role, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.roles.detail(role.id),
      });

      toast({
        title: variables.id ? 'Rol actualizado' : 'Rol creado',
        description: variables.id
          ? 'Los datos del rol se actualizaron correctamente.'
          : 'El rol fue creado correctamente.',
      });
    },
    onError: (error) => {
      console.log({ error });
      toast({
        title: 'Error',
        description: 'Error al guardar el rol, Contacte al administrador',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRoleMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => rolesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.roles.all });
      toast({
        title: 'Rol eliminado',
        description: 'El rol fue eliminado correctamente.',
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
