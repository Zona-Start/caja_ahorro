import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { type ColumnDef } from '@tanstack/react-table';
import z from 'zod';
import { WITHDRAWAL_STATUS_TYPES } from '../../../schemas/inquiry-options';
import { type withdrawalSchema } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

type Withdrawal = z.infer<typeof withdrawalSchema>;

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
    header: 'Solicitado',
    cell: ({ row }) => formatCurrency(Number(row.original.amount), 'VES'),
  },

  {
    accessorKey: 'administrativeFee',
    header: 'Gasto Administrativo',
    cell: ({ row }) =>
      formatCurrency(Number(row.original.administrativeFee), 'VES'),
  },

  {
    accessorKey: 'disbursedAmount',
    header: 'Retirado',
    cell: ({ row }) =>
      formatCurrency(Number(row.original.disbursedAmount), 'VES'),
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
          case 'PROCESSED':
            return 'success';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('p-2 h-full w-full')}>
          <Badge variant={variant as any}>{statusText}</Badge>
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
