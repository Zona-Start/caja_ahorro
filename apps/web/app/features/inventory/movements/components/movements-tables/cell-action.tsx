import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Edit, Eye, MoreHorizontal, XCircle } from 'lucide-react';
import type { InventoryMovement } from '../../schemas/movements.schema';
import { useCancelMovementMutation } from '../../hooks/use-movements-queries';
import { useMovementsModalStore } from '../../store/movements-modal.store';
//import { useAuthStore } from '@/stores/auth.store';

interface MovementsCellActionProps {
  data: InventoryMovement;
}

export function MovementsCellAction({ data }: MovementsCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const cancelMutation = useCancelMovementMutation();
  const { openModal } = useMovementsModalStore();
  //const hasPermission = useAuthStore((state) => state.hasPermission);

  const onConfirmCancel = async () => {
    try {
      setLoading(true);
      await cancelMutation.mutateAsync(data.id!);
      setOpenCancel(false);
    } catch {
      // error handled by mutation
    } finally {
      setLoading(false);
    }
  };

  const isCancelled = data.status === 'cancelled';

  return (
    <>
      <AlertModal
        isOpen={openCancel}
        onClose={() => setOpenCancel(false)}
        onConfirm={onConfirmCancel}
        loading={loading}
        title="¿Cancelar este movimiento?"
        description="El movimiento será marcado como cancelado. Esta acción no se puede deshacer."
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openModal('view', data)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          {/*
          {!isCancelled && hasPermission('inventory:stock', 'update') && (
            <DropdownMenuItem onClick={() => openModal('edit', data)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          {!isCancelled && hasPermission('inventory:stock', 'delete') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenCancel(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </DropdownMenuItem>
            </>
          )}
          */}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
