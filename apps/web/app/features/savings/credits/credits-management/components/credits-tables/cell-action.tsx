'use client';

import { useState } from 'react';
import { CheckSquare, Trash, Eye } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  useApproveCreditManagementMutation,
  useDeleteCreditManagementMutation,
} from '../../hooks/use-credits-management-mutation';
import { useNavigate } from 'react-router';
import type { CreditTableRow } from './columns';

interface CellActionProps {
  data: CreditTableRow;
  onViewDetails?: (data: CreditTableRow) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, onViewDetails }) => {
  const [openApprove, setOpenApprove] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

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
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onViewDetails?.(data)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver Detalles</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {data.status === 'REQUESTED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setOpenApprove(true)}
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aprobar Crédito</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {data.status === 'REQUESTED' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setOpenDelete(true)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Eliminar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
};
