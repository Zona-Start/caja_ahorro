'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { Progress } from '@repo/shadcn/progress';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { LOAN_STATUS_TYPES } from '../../../schemas/inquiry-options';
import { loansResponseSchema } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

type Loan = z.infer<typeof loansResponseSchema>['data'][number];

export const columns: ColumnDef<Loan>[] = [
  {
    accessorKey: 'loanType',
    header: 'Tipo',
  },
  {
    accessorKey: 'loanAmount',
    header: 'Monto Solicitado',
    cell: ({ row }) => formatCurrency(Number(row.original.loanAmount), 'VES'),
  },
  {
    accessorKey: 'outstandingBalance',
    header: 'Saldo Pendiente',
    cell: ({ row }) =>
      formatCurrency(Number(row.original.outstandingBalance), 'VES'),
  },
  {
    accessorKey: 'progress',
    header: 'Progreso',
    cell: ({ row }) => {
      const progress = parseFloat(row.original.progress);
      return (
        <div className="flex items-center gap-2">
          <Progress value={progress * 10} className="w-[60%]" />
          <span>{progress.toFixed(1)}/10</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'requestDate',
    header: 'Fecha Sol.',
    cell: ({ row }) =>
      new Date(row.original.requestDate).toLocaleDateString('es-VE'),
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        LOAN_STATUS_TYPES[status as keyof typeof LOAN_STATUS_TYPES] || status;

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
            return 'secondary';
          case 'DISBURSED':
            return 'warning';
          case 'IN_PAYMENT':
            return 'outline';
          case 'PAID':
            return 'success';
          case 'CANCELLED':
            return 'destructive';
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
