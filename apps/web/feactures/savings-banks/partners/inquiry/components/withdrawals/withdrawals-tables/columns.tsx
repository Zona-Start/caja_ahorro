'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import {
  PAYMENT_METHOD_TYPES,
  WITHDRAWAL_STATUS_TYPES,
} from '../../../schemas/inquiry-options';
import { withdrawalsResponseSchema } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

type Withdrawal = z.infer<typeof withdrawalsResponseSchema>['data'][number];

export const columns: ColumnDef<Withdrawal>[] = [
  {
    accessorKey: 'withdrawalDate',
    header: 'Fecha',
    cell: ({ row }) =>
      new Date(row.original.withdrawalDate).toLocaleDateString('es-VE'),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => formatCurrency(Number(row.original.amount), 'VES'),
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método de Pago',
    cell: ({ row }) => {
      const paymentMethod = row.original.paymentMethod;
      return (
        PAYMENT_METHOD_TYPES[
          paymentMethod as keyof typeof PAYMENT_METHOD_TYPES
        ] || paymentMethod
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        WITHDRAWAL_STATUS_TYPES[
          status as keyof typeof WITHDRAWAL_STATUS_TYPES
        ] || status;

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
