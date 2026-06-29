import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { inventoryMovementsKeys } from '../keys/movements-keys';
import type { InventoryMovement } from '../schemas/movements.schema';
import { movementsService } from '../services/movements-service';
import type {
  MovementsPaginatedResponse,
  MovementsQueryParams,
} from '../services/movements-service';

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || 'Ocurrió un error inesperado';
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
};

export function useMovementsQuery(
  filters: MovementsQueryParams,
): UseQueryResult<MovementsPaginatedResponse> {
  return useQuery({
    queryKey: inventoryMovementsKeys.list(filters),
    queryFn: () => movementsService.getAll(filters),
  });
}

export function useMovementQuery(
  id: string,
  enabled = true,
): UseQueryResult<InventoryMovement> {
  return useQuery({
    queryKey: inventoryMovementsKeys.detail(id),
    queryFn: () => movementsService.getById(id),
    enabled: enabled && !!id,
  });
}

export function useCreateMovementMutation(): UseMutationResult<
  InventoryMovement,
  unknown,
  InventoryMovement
> {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (p) => movementsService.create(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryMovementsKeys.all });
      toast({ title: 'Movimiento creado', description: 'El movimiento de inventario ha sido creado exitosamente.' });
    },
    onError: (e) => {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    },
  });
}

export function useUpdateMovementMutation(): UseMutationResult<
  InventoryMovement,
  unknown,
  InventoryMovement
> {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (p) => movementsService.update(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryMovementsKeys.all });
      toast({ title: 'Movimiento actualizado', description: 'El movimiento ha sido actualizado exitosamente.' });
    },
    onError: (e) => {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    },
  });
}

export function useCancelMovementMutation(): UseMutationResult<
  void,
  unknown,
  string
> {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => movementsService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryMovementsKeys.all });
      toast({ title: 'Movimiento cancelado', description: 'El movimiento de inventario ha sido cancelado.' });
    },
    onError: (e) => {
      toast({ title: 'Error', description: getErrorMessage(e), variant: 'destructive' });
    },
  });
}
