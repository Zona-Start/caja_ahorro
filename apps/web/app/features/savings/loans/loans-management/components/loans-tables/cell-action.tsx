'use client';

import { useState } from 'react';
import { CheckSquare, Trash2, Eye, MoreHorizontal, HandCoins } from 'lucide-react';
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
  useApproveLoansManagementMutation,
  useDeleteLoansManagementMutation,
} from '../../hooks/use-loans-management-mutation';
import { DisburseLoanModal } from '../disburse-loan-modal';
import type { LoanTableRow } from './columns';

interface CellActionProps {
  data: LoanTableRow;
  onViewDetails?: (data: LoanTableRow) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onViewDetails }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);

  const { mutate: deleteLoan, isPending: isDeleting } =
    useDeleteLoansManagementMutation();
  const { mutate: approveLoan, isPending: isApproving } =
    useApproveLoansManagementMutation();

  const onConfirmDelete = () => {
    deleteLoan(String(data.id), {
      onSuccess: () => setOpenDelete(false),
    });
  };

  const onConfirmApprove = () => {
    approveLoan(String(data.id), {
      onSuccess: () => setOpenApprove(false),
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title="¿Está seguro que desea anular el Préstamo?"
        description="Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={onConfirmApprove}
        loading={isApproving}
        title="¿Está seguro que desea aprobar este Préstamo?"
        description="Esta acción no se puede deshacer."
      />
      <DisburseLoanModal
        isOpen={showDisburseModal}
        onClose={() => setShowDisburseModal(false)}
        loan={data as any}
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
              <DropdownMenuItem
                onClick={() => setOpenApprove(true)}
                className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Aprobar Préstamo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setOpenDelete(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Anular Préstamo
              </DropdownMenuItem>
            </>
          )}

          {data.status === 'APPROVED' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDisburseModal(true)}
                className="text-blue-600 focus:text-blue-600 focus:bg-blue-50"
              >
                <HandCoins className="mr-2 h-4 w-4" />
                Desembolsar Préstamo
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
