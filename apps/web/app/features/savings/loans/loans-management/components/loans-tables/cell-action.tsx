'use client';

import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Eye, FileCheck, HandCoins, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  useApproveLoansManagementMutation,
  useDeleteLoansManagementMutation,
} from '../../hooks/use-loans-management-mutation';
import { type LoanManagement } from '../../schemas/loans-management.schema';
import { DisburseLoanModal } from '../disburse-loan-modal';
import { LoanDetailsModal } from '../loan-details-modal';

interface CellActionProps {
  data: LoanManagement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);

  const { mutate: deleteLoan } = useDeleteLoansManagementMutation();
  const { mutate: approveLoan, isPending: isUpdating } =
    useApproveLoansManagementMutation();

  const onConfirmDelete = () => {
    setLoading(true);
    const id = data.id !== undefined ? Number(data.id) : 0;
    deleteLoan(id, {
      onSettled: () => {
        setLoading(false);
        setOpen(false);
      },
    });
  };

  const onConfirmApprove = () => {
    const id = data.id !== undefined ? Number(data.id) : 0;
    approveLoan(id, {
      onSuccess: () => {
        setShowApprovedModal(false);
      },
    });
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro que desea anular el Préstamo?"
        description="Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={showApprovedModal}
        onClose={() => setShowApprovedModal(false)}
        onConfirm={onConfirmApprove}
        loading={isUpdating}
        title="¿Estás seguro que desea Aprobar este Préstamo?"
        description="Esta acción no se puede deshacer."
      />
      <LoanDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        loan={data}
      />
      <DisburseLoanModal
        isOpen={showDisburseModal}
        onClose={() => setShowDisburseModal(false)}
        loan={data}
      />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowDetailsModal(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver Detalles</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={data.status !== 'REQUESTED'}
                onClick={() => setShowApprovedModal(true)}
              >
                <FileCheck className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aprobar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-600/20"
                variant="outline"
                size="icon"
                disabled={data.status !== 'APPROVED'}
                onClick={() => setShowDisburseModal(true)}
              >
                <HandCoins className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Desembolsar Préstamo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={data.status !== 'REQUESTED'}
                onClick={() => setOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Anular</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
