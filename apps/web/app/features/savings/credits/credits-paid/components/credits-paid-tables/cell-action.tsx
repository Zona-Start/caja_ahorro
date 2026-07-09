'use client';

import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Eye, MoreHorizontal, XCircle } from 'lucide-react';
import { useDeleteCreditPaymentMutation } from '../../hooks/use-credits-paid-mutation';
import { useCreditPaidById } from '../../hooks/use-credits-paid-query';
import type { CreditPaymentApi } from '../../schemas/credits-paid-api-response';
import { CreditPaidDetailModal } from './credit-paid-detail-modal';

interface CellActionProps {
  data: CreditPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);

  const { mutate: deletePayment, isPending: isDeleting } =
    useDeleteCreditPaymentMutation();

  const { data: detailData, isLoading: isLoadingDetail } = useCreditPaidById(
    openView ? data.id : '',
    { enabled: openView },
  );

  const onConfirm = () => {
    deletePayment(data.id, {
      onSuccess: () => {
        setOpenDelete(false);
      },
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={isDeleting}
        title="¿Está seguro que desea anular este pago?"
        description="Esta acción marcará el pago como anulado y revertirá los cambios en la tabla de amortización."
      />

      {openView && (
        <CreditPaidDetailModal
          isOpen={openView}
          onClose={() => setOpenView(false)}
          data={detailData}
          isLoading={isLoadingDetail}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Anular
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
