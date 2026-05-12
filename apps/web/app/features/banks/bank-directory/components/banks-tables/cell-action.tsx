import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { apiClient } from '@/lib/api-client';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { bankDirectoryKeys } from '../../keys/bank-directory-keys';
import type { Bank } from '../../services/banks-service';
import { BanksModal } from '../banks-modal';

interface BankCellActionProps {
  data: Bank;
}

export const CellAction: React.FC<BankCellActionProps> = ({ data }) => {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  const onDeleteConfirm = async () => {
    try {
      setLoading(true);
      await apiClient.delete(`/banks-directory/${data.id}`);
      queryClient.invalidateQueries({ queryKey: bankDirectoryKeys.all });
      toastSuccess('Banco eliminado correctamente');
      setOpenDelete(false);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error al eliminar el banco');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onDeleteConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar este banco?"
        description="Esta acción no se puede deshacer."
      />

      <BanksModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
      />

      <BanksModal
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
