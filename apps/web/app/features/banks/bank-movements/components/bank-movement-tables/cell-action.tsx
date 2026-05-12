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
import {
  useBankMovementQuery,
  useDeleteBankMovementMutation,
} from '../../hooks/use-bank-movements-query';
import type { BankMovement } from '../../schemas/bank-movement.schema';
import { BankMovementModal } from '../bank-movement-modal';

interface CellActionProps {
  data: BankMovement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { mutate: deleteMovement } = useDeleteBankMovementMutation();
  const { data: movementData } = useBankMovementQuery(
    selectedId!,
    selectedId !== null,
  );

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteMovement(data.id);
      setOpenDelete(false);
    } catch {
      // Error handled in mutation
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    setSelectedId(data.id);
    setOpenView(true);
  };

  const handleEdit = () => {
    setSelectedId(data.id);
    setOpenEdit(true);
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar este movimiento bancario?"
        description="Esta acción no se puede deshacer."
      />

      {movementData && (
        <>
          <BankMovementModal
            open={openEdit}
            onOpenChange={(open) => {
              setOpenEdit(open);
              if (!open) setSelectedId(null);
            }}
            defaultValues={movementData}
            mode="edit"
          />

          <BankMovementModal
            open={openView}
            onOpenChange={(open) => {
              setOpenView(open);
              if (!open) setSelectedId(null);
            }}
            defaultValues={movementData}
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
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
