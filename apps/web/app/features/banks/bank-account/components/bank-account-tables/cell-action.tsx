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
import { Edit, Eye, MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';
import type { BankAccount } from '../../schemas/bank-account.schema';
import {
  useDeleteBankAccountMutation,
  useReverseBankAccountMutation,
} from '../../hooks/use-bank-account-query';
import { BankAccountModal } from '../bank-account-modal';

interface CellActionProps {
  data: BankAccount;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openReverse, setOpenReverse] = useState(false);

  const deleteMutation = useDeleteBankAccountMutation();
  const reverseMutation = useReverseBankAccountMutation();

  const canDelete = !data.openingEntryPosted;
  const canReverse = !!data.linkedChartAccountId;

  const onDeleteConfirm = () => {
    deleteMutation.mutate(data.id, {
      onSuccess: () => setOpenDelete(false),
    });
  };

  const onReverseConfirm = () => {
    reverseMutation.mutate(data.id, {
      onSuccess: () => setOpenReverse(false),
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
        description="Esta acción no se puede deshacer. La cuenta no debe tener asiento de apertura ni cuenta contable vinculada."
      />

      <AlertModal
        isOpen={openReverse}
        onClose={() => setOpenReverse(false)}
        onConfirm={onReverseConfirm}
        loading={reverseMutation.isPending}
        title="¿Estás seguro que deseas reversar esta cuenta bancaria?"
        description="Se generará un asiento de reverso y la cuenta será marcada como inactiva. Esta acción no se puede deshacer."
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
          {canReverse && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenReverse(true)}
                className="text-amber-600 focus:text-amber-600 focus:bg-amber-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reversar
              </DropdownMenuItem>
            </>
          )}
          {canDelete && (
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
