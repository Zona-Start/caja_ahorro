'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Eye, FileCheck, Trash } from 'lucide-react';
import { useState } from 'react';
import {
  useAprobedLoanMutation,
  useDeleteLoan,
} from '../../hooks/use-loans-management-mutation';
import { LoanManagement } from '../../schemas/loans-management.schema';
import { LoanDetailsModal } from '../loan-details-modal';

interface CellActionProps {
  data: LoanManagement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAprobedModal, setShowAprobedModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { mutate: deleteLoan } = useDeleteLoan();

  const { mutate: aprobeLoan, isPending: isUpdating } =
    useAprobedLoanMutation();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteLoan(Number(data.id!));
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUpdate = async () => {
    aprobeLoan(Number(data.id!), {
      onSuccess: () => {
        setShowAprobedModal(false);
      },
    });
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea anular el Prestamo? "
        description="Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={showAprobedModal}
        onClose={() => setShowAprobedModal(false)}
        onConfirm={onConfirmUpdate}
        loading={isUpdating}
        title="¿Estás seguro que desea Aprobar este Prestamo?"
        description="Esta acción no se puede deshacer."
      />
      <LoanDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        loan={data}
      />
      <Toaster />
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
                onClick={() => {
                  setShowAprobedModal(true);
                }}
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

