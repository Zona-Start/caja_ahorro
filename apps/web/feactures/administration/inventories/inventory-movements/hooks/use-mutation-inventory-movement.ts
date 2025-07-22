import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteInventoryMovement,
  saveInventoryMovementAction,
} from '../actions/inventory-movement-actions';
import { InventoryMovement } from '../schemas/inventory-movement.schema';

export function useInventoryMovementMutation() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: InventoryMovement) => saveInventoryMovementAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      toast.success('Movimiento de inventario guardado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al guardar el movimiento de inventario');
      console.error('Error:', error);
    },
  });

  return mutation;
}

export function useDeleteInventoryMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteInventoryMovement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
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
