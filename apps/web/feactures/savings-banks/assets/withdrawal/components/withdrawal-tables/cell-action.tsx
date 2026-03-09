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
import { Eye, FileCheck, Trash, HandCoins } from 'lucide-react';
import { useState } from 'react';
import {
  useAprobeWithdrawalMutation,
  useDeleteWithdrawalMutation,
} from '../../hooks/use-withdrawal-mutation';
import { WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { WithdrawalDetailsModal } from '../withdrawal-details-modal';
import { WithdrawalDisbursementModal } from '../withdrawal-disbursement-modal';

interface CellActionProps {
  data: WithdrawalPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showAprobedModal, setShowAprobedModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { mutate: deleteWithdrawal } = useDeleteWithdrawalMutation();

  const { mutate: aprobeMutation, isPending: isUpdating } =
    useAprobeWithdrawalMutation();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      deleteWithdrawal(Number(data.id!));
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConfirmUpdate = async () => {
    aprobeMutation(Number(data.id!), {
      onSuccess: () => {
        setShowAprobedModal(false);
      },
    });
  };

  return (
    <>
      <WithdrawalDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        withdrawal={data}
      />
      <WithdrawalDisbursementModal
        isOpen={showDisburseModal}
        onClose={() => setShowDisburseModal(false)}
        withdrawal={data}
      />
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro que desea anular el retiro? "
        description="Esta acción no se puede deshacer."
      />

      <AlertModal
        isOpen={showAprobedModal}
        onClose={() => setShowAprobedModal(false)}
        onConfirm={onConfirmUpdate}
        loading={isUpdating}
        title="¿Estás seguro que desea Aprobar este retiro?"
        description="Esta acción no se puede deshacer."
      />
      <Toaster />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDetailsModalOpen(true)}
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
                disabled={data.status !== 'APPROVED'}
                onClick={() => {
                  setShowDisburseModal(true);
                }}
              >
                <HandCoins className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Desembolsar</p>
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
                onClick={() => setOpen(true)}
                disabled={data.status !== 'REQUESTED'}
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
