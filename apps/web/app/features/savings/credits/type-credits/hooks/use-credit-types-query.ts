import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { type CreditType, type CreditTypeMutation } from '../schemas/credit-types.schema';
import { creditTypesService } from '../services/type-credits-service';
import { type CreditTypesFilters } from './use-credit-types-filters';

const mapFiltersToApiParams = (filters: CreditTypesFilters) => ({
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

export function useCreditTypesQuery(
  filters: CreditTypesFilters,
  enabled: boolean = true,
): UseQueryResult<{ data: CreditType[]; meta: Record<string, unknown> }> {
  return useQuery({
    queryKey: ['creditTypes', 'list', filters],
    queryFn: () => creditTypesService.getAll(mapFiltersToApiParams(filters)),
    enabled,
  });
}

export function useCreditTypeQuery(
  id: number,
  enabled: boolean = true,
): UseQueryResult<CreditType> {
  return useQuery({
    queryKey: ['creditTypes', 'detail', id],
    queryFn: () => creditTypesService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useSaveCreditTypeMutation(): UseMutationResult<
  CreditType,
  unknown,
  CreditTypeMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => creditTypesService.save(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['creditTypes'] });
      toast({
        title: variables.id ? 'Tipo de crédito actualizado' : 'Tipo de crédito creado',
        description: variables.id
          ? 'Los datos del tipo de crédito se actualizaron correctamente.'
          : 'El tipo de crédito fue creado correctamente.',
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

export function useDeleteCreditTypeMutation(): UseMutationResult<
  { message: string },
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => creditTypesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditTypes'] });
      toast({
        title: 'Tipo de crédito eliminado',
        description: 'El tipo de crédito fue eliminado correctamente.',
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