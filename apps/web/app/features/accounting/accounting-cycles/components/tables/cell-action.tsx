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
import {
  AlertTriangle,
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Trash,
} from 'lucide-react';
import type { AccountingCycle } from '../../schemas/accounting-cycle.schema';
import {
  useChangeCycleStatusMutation,
  useDeleteAccountingCycleMutation,
} from '../../hooks/use-accounting-cycles-mutation';
import { AccountingCycleModal } from '../accounting-cycle-modal';
import { AccountingCycleDetailModal } from '../accounting-cycle-detail-modal';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: AccountingCycle;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openStatusConfirm, setOpenStatusConfirm] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const changeStatusMutation = useChangeCycleStatusMutation();
  const deleteMutation = useDeleteAccountingCycleMutation();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const isOpen = data.status === 'OPEN';
  const isPending = data.status === 'PENDING';

  const handleToggleStatus = () => {
    const newStatus = isOpen ? 'PENDING' : 'OPEN';
    changeStatusMutation.mutate(
      { id: data.id!, status: newStatus },
      {
        onSuccess: () => setOpenStatusConfirm(false),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(data.id!, {
      onSuccess: () => setOpenDeleteConfirm(false),
    });
  };

  const statusActionLabel = isOpen ? 'Marcar como Pendiente' : 'Marcar como Abierto';
  const statusActionIcon = isOpen ? (
    <AlertTriangle className="mr-2 h-4 w-4" />
  ) : (
    <RefreshCw className="mr-2 h-4 w-4" />
  );

  return (
    <>
      <AlertModal
        isOpen={openStatusConfirm}
        onClose={() => setOpenStatusConfirm(false)}
        onConfirm={handleToggleStatus}
        loading={changeStatusMutation.isPending}
        title={
          isOpen
            ? '¿Cambiar este ciclo a Pendiente?'
            : '¿Cambiar este ciclo a Abierto?'
        }
        description={
          isOpen
            ? 'Solo se puede cambiar a Pendiente si no existen asientos contables registrados en este ciclo.'
            : 'Solo puede haber un ciclo Abierto a la vez.'
        }
      />

      <AlertModal
        isOpen={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="¿Estás seguro de eliminar este ciclo contable?"
        description="Esta acción no se puede deshacer. Solo se pueden eliminar ciclos que no tengan asientos contables registrados y que no estén Abiertos."
      />

      <AccountingCycleModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
      />

      <AccountingCycleDetailModal
        open={openView}
        onOpenChange={setOpenView}
        data={data}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          {hasPermission("accounting:cycles", "update") && (
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpenStatusConfirm(true)}
            className="text-amber-600 focus:text-amber-600 focus:bg-amber-50"
          >
            {statusActionIcon}
            {statusActionLabel}
          </DropdownMenuItem>
          {!isOpen && hasPermission("accounting:cycles", "delete") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenDeleteConfirm(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
