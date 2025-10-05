import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteInventoryMovement,
  saveInventoryMovementAction,
} from '../actions/inventory-movement-actions';
import { CreateInventoryMovement } from '../schemas/inventory-movement.schema';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook para la mutación (crear/actualizar) de movimientos de inventario
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useInventoryMovementMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateInventoryMovement) => saveInventoryMovementAction(data),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inventoryMovements.all() 
      });
      toast.success('Movimiento de inventario guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el movimiento de inventario');
      console.error('Error:', error);
    },
  });

  return mutation;
}

/**
 * Hook para eliminar un movimiento de inventario
 * Utiliza la fábrica centralizada de claves para invalidar queries
 */
export function useDeleteInventoryMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInventoryMovement(id),
    onSuccess: () => {
      // ✅ Invalidación robusta usando la fábrica de claves
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.inventoryMovements.all() 
      });
      toast.success('Movimiento de inventario eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (error.message === 'Inventory movement not found') {
          toast.error('Error, Movimiento de inventario no encontrado');
        } else {
          toast.error('Error al eliminar el movimiento de inventario');
        }
      }
    },
  });
}
