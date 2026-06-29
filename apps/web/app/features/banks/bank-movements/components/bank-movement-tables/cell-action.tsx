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
import { Edit, Eye, Link, MoreHorizontal, RotateCcw, Trash2, Unlink } from 'lucide-react';
import {
  useDeleteBankMovementMutation,
  useUnlinkMutation,
  useReverseMutation,
} from '../../hooks/use-bank-movements-query';
import type { BankMovement } from '../../schemas/bank-movement.schema';
import { BankMovementModal } from '../bank-movement-modal';

interface CellActionProps {
  data: BankMovement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openLink, setOpenLink] = useState(false);

  const deleteMutation = useDeleteBankMovementMutation();
  const unlinkMutation = useUnlinkMutation();
  const reverseMutation = useReverseMutation();

  const isLinked = data.internalLinkStatus === 'LINKED';
  const isReconciled = data.reconciliationStatus === 'RECONCILED';

  const handleDelete = () => {
    deleteMutation.mutate(data.id, { onSuccess: () => setOpenDelete(false) });
  };

  const handleUnlink = () => {
    unlinkMutation.mutate(data.id);
  };

  const handleReverse = () => {
    reverseMutation.mutate({
      id: data.id!,
      payload: {
        valueDate: new Date().toISOString().split('T')[0],
        reason: 'Reversión manual',
      },
    } as any);
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="¿Estás seguro que deseas eliminar este movimiento bancario?"
        description="Esta acción no se puede deshacer."
      />

      <BankMovementModal open={openView} onOpenChange={setOpenView} defaultValues={data} mode="view" />
      <BankMovementModal open={openEdit} onOpenChange={setOpenEdit} defaultValues={data} mode="edit" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" /> Ver Detalles
          </DropdownMenuItem>
          {!isLinked && (
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* {!isLinked && (
            <DropdownMenuItem onClick={() => setOpenLink(true)}>
              <Link className="mr-2 h-4 w-4" /> Vincular
            </DropdownMenuItem>
          )}
          {isLinked && (
            <DropdownMenuItem onClick={handleUnlink} className="text-amber-600">
              <Unlink className="mr-2 h-4 w-4" /> Desvincular
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator /> */}
          {isLinked && (
            <DropdownMenuItem onClick={handleReverse} className="text-amber-600">
              <RotateCcw className="mr-2 h-4 w-4" /> Reversar
            </DropdownMenuItem>
          )}
          {!isLinked && (
            <DropdownMenuItem onClick={() => setOpenDelete(true)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
