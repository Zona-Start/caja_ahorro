'use client';

import { useState } from 'react';
import { Eye, Trash } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { useDeleteLoanPaymentMutation } from '../../hooks/use-loans-paid-delete-mutation';
import { type LoanPaymentApi } from '../../schemas/loans-paid-api-response';

interface CellActionProps {
  data: LoanPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { mutate: deletePayment } = useDeleteLoanPaymentMutation();

  const onConfirmDelete = () => {
    if (
      window.confirm(
        '¿Está seguro que desea eliminar este pago? Esta acción no se puede deshacer.'
      )
    ) {
      deletePayment(Number(data.id));
    }
  };

  return (
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
              onClick={onConfirmDelete}
            >
              <Trash className="h-4 w-4 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Eliminar</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
