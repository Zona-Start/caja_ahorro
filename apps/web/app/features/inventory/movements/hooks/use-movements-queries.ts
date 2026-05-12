import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { inventoryMovementsKeys } from '../keys/movements-keys';
import type { InventoryMovement, StockResponse } from '../schemas/movements.schema';
import { movementsService } from '../services/movements-service';
import type { MovementsPaginatedResponse } from '../services/movements-service';
import type { MovementsFilters } from './use-movements-filters';

const getErrorMessage = (error: unknown): string => {
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

export function useMovementsQuery(
  filters: MovementsFilters,
  enabled = true,
): UseQueryResult<MovementsPaginatedResponse> {
  return useQuery({
    queryKey: inventoryMovementsKeys.list(filters),
    queryFn: () => movementsService.getAll(filters),
    enabled,
  });
}

export function useMovementQuery(
  id: number,
  enabled = true,
): UseQueryResult<InventoryMovement> {
  return useQuery({
    queryKey: inventoryMovementsKeys.detail(id),
    queryFn: () => movementsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useStockQuery(
  itemType: string,
  itemId: number,
  enabled = true,
): UseQueryResult<StockResponse> {
  return useQuery({
    queryKey: inventoryMovementsKeys.stockDetail(itemType, itemId),
    queryFn: () => movementsService.getStock(itemType, itemId),
    enabled: enabled && !!itemType && !!itemId,
  });
}

export function useCreateMovementMutation(): UseMutationResult<
  InventoryMovement,
  unknown,
  object
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => movementsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventoryMovementsKeys.all,
      });
      toastSuccess('Movimiento de inventario creado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}

export function useCancelMovementMutation(): UseMutationResult<
  { message: string },
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  return useMutation({
    mutationFn: (id) => movementsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventoryMovementsKeys.all,
      });
      toastSuccess('Movimiento cancelado correctamente');
    },
    onError: (error) => {
      toastError(getErrorMessage(error));
    },
  });
}
