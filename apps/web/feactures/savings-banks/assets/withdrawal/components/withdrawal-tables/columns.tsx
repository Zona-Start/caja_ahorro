'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { ESTATUS_TYPES } from '../../schemas/withdrawal-options';
import { CellAction } from './cell-action';

const statusColors: { [key: string]: string } = {
  REQUESTED: 'bg-yellow-500 hover:bg-yellow-600',
  APPROVED: 'bg-blue-500 hover:bg-blue-600',
  PAID: 'bg-green-500 hover:bg-green-600',
  REJECTED: 'bg-red-500 hover:bg-red-600',
  CANCELED: 'bg-gray-500 hover:bg-gray-600',
};

export const columns: ColumnDef<WithdrawalPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'withdrawalDate',
    header: 'Fecha Retiro',
  },

  {
    accessorKey: 'withdrawalType',
    header: 'Tipo',
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto',
    cell: ({ row }) => {
      return formatCurrency(Number(row.original.requestedAmount), 'VES');
    },
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y apellido asociado',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'default';
          case 'APPROVED':
            return 'warning';
          case 'REJECTED':
            return 'destructive';
          case 'CANCELLED':
            return 'destructive';
          case 'PENDING_DISBURSEMENT_BANK_BATCH':
            return 'outline';
          case 'DISBURSED':
            return 'success';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('p-2 h-full w-full')}>
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
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
