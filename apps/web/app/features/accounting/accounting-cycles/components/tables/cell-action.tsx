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
import { Edit, Eye, Lock, MoreHorizontal } from 'lucide-react';
import type { AccountingCycle } from '../../schemas/accounting-cycle.schema';
import { useCloseAccountingCycleMutation } from '../../hooks/use-accounting-cycles-mutation';
import { AccountingCycleModal } from '../accounting-cycle-modal';

interface CellActionProps {
  data: AccountingCycle;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  const closeCycleMutation = useCloseAccountingCycleMutation();

  const onConfirm = async () => {
    try {
      setLoading(true);
      await closeCycleMutation.mutateAsync(data.id!);
      setOpenDelete(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isClosed = data.status === 'CLOSED';

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea cerrar este ciclo contable?"
        description="Esta acción no se puede deshacer."
      />

      <AccountingCycleModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
      />

      <AccountingCycleModal
        open={openView}
        onOpenChange={setOpenView}
        defaultValues={data}
        mode="view"
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
          <DropdownMenuItem
            onClick={() => setOpenEdit(true)}
            disabled={isClosed}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            disabled={isClosed}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Lock className="mr-2 h-4 w-4" />
            Cerrar Ciclo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
