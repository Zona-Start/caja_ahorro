'use client';

import { useState } from 'react';
import { CheckSquare, Trash, Banknote } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { AlertModal } from '@/components/shared/alert-modal';

import { useApproveSettlementMutation } from '../../hooks/use-settlement-mutation';
import { type SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { DisburseSettlementModal } from './disburse-modal';

interface CellActionProps {
  data: SettlementPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openApprove, setOpenApprove] = useState(false);
  const [openDisburse, setOpenDisburse] = useState(false);

  const { mutate: approveSettlement, isPending: isApproving } =
    useApproveSettlementMutation();

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
      <DisburseSettlementModal
        isOpen={openDisburse}
        onClose={() => setOpenDisburse(false)}
        data={data}
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
        {data.status === 'REQUESTED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
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
        )}

        {data.status === 'PROCESSED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  onClick={() => setOpenDisburse(true)}
                >
                  <Banknote className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Procesar Desembolso</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
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
