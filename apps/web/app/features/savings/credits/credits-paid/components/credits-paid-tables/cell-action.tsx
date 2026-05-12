'use client';

import { useState } from 'react';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { useDeleteCreditPaymentMutation } from '../../hooks/use-credits-paid-mutation';
import type { CreditPaymentApi } from '../../schemas/credits-paid-api-response';

interface CellActionProps {
  data: CreditPaymentApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openView, setOpenView] = useState(false);

  const { mutate: deletePayment } = useDeleteCreditPaymentMutation();

  const onConfirm = () => {
    setLoading(true);
    deletePayment(data.id, {
      onSuccess: () => {
        setOpenDelete(false);
      },
      onSettled: () => {
        setLoading(false);
      },
    });
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Está seguro que desea eliminar este pago?"
        description="Esta acción no se puede deshacer. El pago registrado será eliminado del sistema."
      />

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
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
