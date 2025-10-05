'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { useAuthorizeAdvancePaymentMutation } from '../../hooks';
import {
  STATUS_PAYMENT,
  STATUS_TRANSACTIONS,
} from '../../schemas/manage-documents.options';
import { Advance } from '../../schemas/manage-documents.schema';

// TODO: Implement actions
const CellAction = ({ row }: { row: any }) => {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { mutate: authorizeAdvance } = useAuthorizeAdvancePaymentMutation();
  //funciona que llama la autorizacion de pagos
  const onConfirmAccount = () => {
    setIsUpdating(true);
    authorizeAdvance(row.original.id!, {
      onSuccess: () => {
        setIsUpdating(false);
        setShowAccountModal(false);
      },
    });
  };
  return (
    <div className="flex gap-2">
      <AlertModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onConfirm={onConfirmAccount}
        loading={isUpdating}
        title="¿Estás seguro que desea Autorizar el pago de este Anticipo ?"
        description="Esta acción no se puede deshacer."
      />
      {row.original.isAuthorizePayment === false && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAccountModal(true)}
        >
          Autorizar Pago
        </Button>
      )}
      <Button variant="outline" size="sm">
        Ver
      </Button>
    </div>
  );
};

export const columnsAdvances: ColumnDef<Advance>[] = [
  {
    accessorKey: 'transactionNumber',
    header: 'Referencia',
  },
  {
    accessorKey: 'supplier.name',
    header: 'Proveedor',
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      return (
        <div className=" font-medium">{formatCurrency(amount, 'VES')}</div>
      );
    },
  },
  {
    accessorKey: 'availableAmount',
    header: 'Monto Disponible',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('availableAmount'));
      return (
        <div className=" font-medium">{formatCurrency(amount, 'VES')}</div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Uso',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        STATUS_TRANSACTIONS[status as keyof typeof STATUS_TRANSACTIONS] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'ACTIVE':
            return 'default';
          case 'PARTIALLY_APPLIED':
            return 'warning';
          case 'APPLIED':
            return 'success';
          case 'REVERSED':
            return 'destructive';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('h-full w-full')}>
          <Badge
            variant={
              variant as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'success'
                | 'danger'
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'statusPayment',
    header: 'Pago',
    cell: ({ row }) => {
      const status = row.original.statusPayment;
      const statusText =
        STATUS_PAYMENT[status as keyof typeof STATUS_PAYMENT] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'PENDING':
            return 'outline';
          case 'PAID':
            return 'secondary';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('h-full w-full')}>
          <Badge
            variant={
              variant as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'success'
                | 'danger'
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction row={row} />,
  },
];
