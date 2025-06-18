'use client';

import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Trash } from 'lucide-react';
import { useState } from 'react';

import { SettlementPaymentApi } from '../../schemas/settlement-api-response';

interface CellActionProps {
  data: SettlementPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // const { mutate: deleteWithdrawal } = useDeleteWithdrawal();

  // const onConfirm = async () => {
  //   try {
  //     setLoading(true);
  //     deleteWithdrawal(Number(data.id!));
  //     setOpen(false);
  //   } catch (error) {
  //     console.error('Error:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <>
      {/* <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar el retiro? "
        description="Esta acción no se puede deshacer."
      /> */}
      <Toaster />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
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
