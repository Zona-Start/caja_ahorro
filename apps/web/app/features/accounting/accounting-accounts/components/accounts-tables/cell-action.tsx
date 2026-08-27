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
import { useDeleteAccountingAccount } from '../../hooks/use-accounting-accounts-mutation';
import type { AccountPlanApiResponse } from '../../schemas/account-plan-api';
import { AccountPlanModal } from '../account-plan-modal';
import { AccountPlanDetailModal } from '../account-plan-detail-modal';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: AccountPlanApiResponse;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const { mutate: deleteAccount } = useDeleteAccountingAccount();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteAccount(Number(data.id!));
      setOpenDelete(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar esta cuenta contable?"
        description="Esta acción no se puede deshacer."
      />

      <AccountPlanModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
      />

      <AccountPlanDetailModal
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
          {hasPermission("accounting:chart_of_accounts", "update") && (
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {hasPermission("accounting:chart_of_accounts", "delete") && (
            <DropdownMenuItem
              onClick={() => setOpenDelete(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
