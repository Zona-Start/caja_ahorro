'use client';

import { useState } from 'react';
import { CheckSquare, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  useApproveCreditManagementMutation,
  useDeleteCreditManagementMutation,
} from '../../hooks/use-credits-management-mutation';
import type { CreditTableRow } from './columns';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: CreditTableRow;
  onViewDetails?: (data: CreditTableRow) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onViewDetails }) => {
  const [openApprove, setOpenApprove] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { mutate: approveCredit, isPending: isApproving } =
    useApproveCreditManagementMutation();
  const { mutate: deleteCredit, isPending: isDeleting } =
    useDeleteCreditManagementMutation();

  const onConfirmApprove = () => {
    approveCredit(data.id, {
      onSuccess: () => setOpenApprove(false),
    });
  };

  const onConfirmDelete = () => {
    deleteCredit(data.id, {
      onSuccess: () => setOpenDelete(false),
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={onConfirmApprove}
        loading={isApproving}
        title="¿Está seguro de aprobar el crédito?"
        description="Esta acción aprobará el crédito del asociado. Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title="¿Está seguro que desea eliminar el crédito?"
        description="Esta acción no se puede deshacer."
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewDetails?.(data)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>

          {data.status === 'REQUESTED' && (
            <>
              <DropdownMenuSeparator />
              {hasPermission("portfolio:credits", "approve") && (
                <DropdownMenuItem
                  onClick={() => setOpenApprove(true)}
                  className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Aprobar Crédito
                </DropdownMenuItem>
              )}
              {hasPermission("portfolio:credits", "reject") && (
                <DropdownMenuItem
                  onClick={() => setOpenDelete(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
