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
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useDeleteWithdrawalTypeMutation, useWithdrawalTypeQuery } from '../../hooks/use-withdrawal-types-query';
import type { WithdrawalType } from '../../schemas/withdrawal-types.schema';
import { WithdrawalTypesModal } from '../withdrawal-types-modal';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: WithdrawalType;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { mutate: deleteWithdrawalType } = useDeleteWithdrawalTypeMutation();
  const { data: withdrawalTypeData } = useWithdrawalTypeQuery(selectedId!, selectedId !== null);

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteWithdrawalType(data.id!);
      setOpenDelete(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    setSelectedId(data.id!);
    setOpenView(true);
  };

  const handleEdit = () => {
    setSelectedId(data.id!);
    setOpenEdit(true);
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar este tipo de retiro?"
        description="Esta acción no se puede deshacer."
      />

      {withdrawalTypeData && (
        <>
          <WithdrawalTypesModal
            open={openEdit}
            onOpenChange={(open) => {
              setOpenEdit(open);
              if (!open) setSelectedId(null);
            }}
            defaultValues={withdrawalTypeData}
            mode="edit"
          />

          <WithdrawalTypesModal
            open={openView}
            onOpenChange={(open) => {
              setOpenView(open);
              if (!open) setSelectedId(null);
            }}
            defaultValues={withdrawalTypeData}
            mode="view"
          />
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          {hasPermission("savings:withdrawal-types", "update") && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          {hasPermission("savings:withdrawal-types", "delete") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};