'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/components/ui/tooltip';
import { Edit, Link, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteBankMovement } from '../../hooks/use-mutation-bank-movement';
import { BankMovementApiResponse } from '../../schemas/bank-movement-api.schema';
import { BankMovementModal } from '../bank-movement-modal';

interface CellActionProps {
  data: BankMovementApiResponse;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { mutate: deleteMovement, isPending: isDeleting } = useDeleteBankMovement();

  const onConfirmDelete = () => {
    deleteMovement(data.id, {
        onSuccess: () => setAlertOpen(false)
    });
  };

  return (
    <>
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title="Eliminar Movimiento"
        description="¿Está seguro? Esta acción es irreversible."
      />
      <BankMovementModal
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultValues={{
            ...data,
            transactionDate: new Date(data.transactionDate),
            movementType: parseFloat(data.debitAmount) > 0 ? 'EXIT' : 'ENTRY',
            amount: parseFloat(data.debitAmount || data.creditAmount || '0'),
        }}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // Link logic here
                }}
              >
                <Link className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Vincular</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setAlertOpen(true);
                }}
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
