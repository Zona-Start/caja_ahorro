import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { type TenantMutation, type Tenant } from '../schemas/tenants.schema';
import { tenantsService } from '../services/tenants-service';

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

export function useSaveTenantMutation(): UseMutationResult<
  Tenant,
  unknown,
  TenantMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => tenantsService.save(payload),
    onSuccess: (tenant, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants.count() });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tenants.detail(tenant.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.tenants.byRif(tenant.rif),
      });

      toast({
        title: variables.id ? 'Tenant actualizado' : 'Tenant creado',
        description: variables.id
          ? 'Los datos del tenant se actualizaron correctamente.'
          : 'El tenant fue creado correctamente.',
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

export function useDeleteTenantMutation(): UseMutationResult<
  { message: string },
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => tenantsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tenants.count() });
      toast({
        title: 'Tenant desactivado',
        description: 'El tenant fue desactivado correctamente.',
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

