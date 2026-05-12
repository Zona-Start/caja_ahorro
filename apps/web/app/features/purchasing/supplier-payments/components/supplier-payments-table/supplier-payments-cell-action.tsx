import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { History, MoreHorizontal, RotateCcw } from 'lucide-react';
import type { SupplierPaymentApi } from '../../schemas/supplier-payment-api.schema';
import { useSupplierPaymentReverseMutation } from '../../hooks/use-supplier-payments-mutations';
import { useSupplierPaymentsModalStore } from '../../store/supplier-payments-modal.store';

interface SupplierPaymentsCellActionProps {
  data: SupplierPaymentApi;
}

export function SupplierPaymentsCellAction({ data }: SupplierPaymentsCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [openReverse, setOpenReverse] = useState(false);
  const { openModal } = useSupplierPaymentsModalStore();
  const reverseMutation = useSupplierPaymentReverseMutation();

  const onConfirmReverse = async () => {
    try {
      setLoading(true);
      await reverseMutation.mutateAsync({ paymentId: data.id });
      setOpenReverse(false);
    } catch {
      // error handled by mutation hook
    } finally {
      setLoading(false);
    }
  };

  const canReverse = data.status !== 'REVERSED' && data.status !== 'CANCELLED';

  return (
    <>
      <AlertModal
        isOpen={openReverse}
        onClose={() => setOpenReverse(false)}
        onConfirm={onConfirmReverse}
        loading={loading}
        title="¿Estás seguro de reversar este pago?"
        description="El pago será reversado y se generarán los asientos contables correspondientes."
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => openModal('viewHistory', data.id)}
          >
            <History className="mr-2 h-4 w-4" />
            Ver Historial
          </DropdownMenuItem>
          {canReverse && (
            <DropdownMenuItem
              onClick={() => setOpenReverse(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reversar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
