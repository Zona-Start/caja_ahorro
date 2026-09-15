import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { costCentersKeys } from '../keys/expenses-keys';
import type { CostCenterForm } from '../schemas/cost-centers.schema';
import {
  costCentersService,
  type CostCenterQueryParams,
} from '../services/cost-centers-service';

interface CostCentersPaginatedResponse {
  data: Array<Record<string, unknown> & { id: string }>;
  meta: { page: number; limit: number; totalCount: number; totalPages: number };
}

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error al ejecutar la operación';
};

export function useCostCentersQuery(
  params: CostCenterQueryParams,
): UseQueryResult<CostCentersPaginatedResponse> {
  return useQuery({
    queryKey: costCentersKeys.list(params),
    queryFn: () => costCentersService.getAllPaginated(params),
  });
}

export function useCostCentersAll(): UseQueryResult<{
  data: Array<{
    id: string;
    code: string;
    name: string;
    monthlyBudget: string | null;
  }>;
}> {
  return useQuery({
    queryKey: costCentersKeys.all,
    queryFn: async () => {
      const response = await costCentersService.getAll();
      return { data: response.data || [] };
    },
  });
}

export function useCostCenterBudgetUsage(
  id: string,
  month?: string,
  enabled = true,
): UseQueryResult<{
  data: {
    costCenterId: string;
    period: string;
    used: number;
    budget: number | null;
    remaining: number | null;
    percentage: number | null;
  };
}> {
  return useQuery({
    queryKey: costCentersKeys.budgetUsage(id, month),
    queryFn: () => costCentersService.getBudgetUsage(id, month),
    enabled: enabled && !!id,
  });
}

export function useCreateCostCenterMutation(): UseMutationResult<
  unknown,
  unknown,
  CostCenterForm
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => costCentersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCentersKeys.all });
      toastSuccess('Centro de costo creado correctamente');
    },
    onError: (error) => toastError(getErrorMessage(error)),
  });
}
