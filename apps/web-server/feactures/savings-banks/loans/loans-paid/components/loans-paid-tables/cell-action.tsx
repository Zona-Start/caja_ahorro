'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import { Toaster } from '@repo/shadcn/toaster';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Eye, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteLoanPaid } from '../../hooks/use-loans-paid-mutation';
import { LoanPaymentApi } from '../../schemas/loans-paid-api-response';
import { LoansPaidDetailModal } from '../loans-paid-detail-modal';

interface CellActionProps {
  data: LoanPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const toast = useToastSystem();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { mutate: deleteLoanPaid } = useDeleteLoanPaid();

  const onConfirm = async () => {
    try {
      if (data.paymentStatus === 'DONE') {
        setLoading(true);
        deleteLoanPaid(Number(data.id!));
        setOpen(false);
      } else {
        setOpen(false);
        toast.error({
          title: 'No se puede anular el pago',
          description: 'El pago ya fue cancelado',
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea anular el pago? "
        description="Esta acción no se puede deshacer."
      />
      <LoansPaidDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        data={data}
      />
      <Toaster />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDetailOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles</p>
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
