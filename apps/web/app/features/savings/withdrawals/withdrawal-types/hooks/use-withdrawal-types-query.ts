import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  type WithdrawalType,
  type WithdrawalTypeMutation,
} from '../schemas/withdrawal-types.schema';
import { withdrawalTypesService } from '../services/withdrawal-types-service';
import { type WithdrawalTypesFilters } from './use-withdrawal-types-filters';

const mapFiltersToApiParams = (filters: WithdrawalTypesFilters) => ({
  page: filters.page,
  limit: filters.limit,
  search: filters.search || undefined,
  sortBy: filters.sortBy || undefined,
  sortOrder: filters.sortOrder || undefined,
});

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

export function useWithdrawalTypesQuery(
  filters: WithdrawalTypesFilters,
  enabled: boolean = true,
): UseQueryResult<{ data: WithdrawalType[]; meta: Record<string, unknown> }> {
  return useQuery({
    queryKey: ['withdrawalTypes', 'list', filters],
    queryFn: () =>
      withdrawalTypesService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useWithdrawalTypeQuery(
  id: number,
  enabled: boolean = true,
): UseQueryResult<WithdrawalType> {
  return useQuery({
    queryKey: ['withdrawalTypes', 'detail', id],
    queryFn: () => withdrawalTypesService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useSaveWithdrawalTypeMutation(): UseMutationResult<
  WithdrawalType,
  unknown,
  WithdrawalTypeMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => withdrawalTypesService.save(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalTypes'] });
      toast({
        title: variables.id
          ? 'Tipo de retiro actualizado'
          : 'Tipo de retiro creado',
        description: variables.id
          ? 'Los datos del tipo de retiro se actualizaron correctamente.'
          : 'El tipo de retiro fue creado correctamente.',
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

export function useDeleteWithdrawalTypeMutation(): UseMutationResult<
  { message: string },
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => withdrawalTypesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalTypes'] });
      toast({
        title: 'Tipo de retiro eliminado',
        description: 'El tipo de retiro fue eliminado correctamente.',
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
