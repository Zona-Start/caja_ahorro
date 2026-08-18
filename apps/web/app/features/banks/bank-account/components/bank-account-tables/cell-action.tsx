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
import type { BankAccount } from '../../schemas/bank-account.schema';
import { useDeleteBankAccountMutation } from '../../hooks/use-bank-account-query';
import { BankAccountModal } from '../bank-account-modal';

interface CellActionProps {
  data: BankAccount;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const deleteMutation = useDeleteBankAccountMutation();

  const onDeleteConfirm = () => {
    deleteMutation.mutate(data.id, {
      onSuccess: () => setOpenDelete(false),
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onDeleteConfirm}
        loading={deleteMutation.isPending}
        title="¿Estás seguro que deseas eliminar esta cuenta bancaria?"
        description="Esta acción no se puede deshacer. La cuenta no debe tener movimientos bancarios asociados."
      />

      <BankAccountModal
        open={openView}
        onOpenChange={setOpenView}
        defaultValues={data}
        mode="view"
      />

      <BankAccountModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
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
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
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
