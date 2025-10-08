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
import { CheckSquare, Trash } from 'lucide-react';
import { useState } from 'react';

import { useApproveSettlementMutation } from '../../hooks/use-settlement-mutation';
import { SettlementPaymentApi } from '../../schemas/settlement-api-response';

interface CellActionProps {
  data: SettlementPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);

  const { mutate: approveSettlement, isPending: isApproving } =
    useApproveSettlementMutation();
  // const { mutate: deleteWithdrawal } = useDeleteWithdrawal();

  const onConfirmDelete = async () => {
    // try {
    //   setLoading(true);
    //   deleteWithdrawal(Number(data.id!));
    //   setOpen(false);
    // } catch (error) {
    //   console.error('Error:', error);
    // } finally {
    //   setLoading(false);
    // }
  };

  const onConfirmApprove = async () => {
    approveSettlement(Number(data.id!), {
      onSuccess: () => {
        setOpenApprove(false);
      },
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openApprove}
        onClose={() => setOpenApprove(false)}
        onConfirm={onConfirmApprove}
        loading={isApproving}
        title="¿Está seguro de aprobar la liquidación?"
        description="Esta acción procesará la liquidación del asociado. Esta acción no se puede deshacer."
      />
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro que desea eliminar el retiro? "
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
                onClick={() => setOpenApprove(true)}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aprobar Liquidación</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpenDelete(true)}
                disabled // Disabling delete for now as it's not implemented
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
