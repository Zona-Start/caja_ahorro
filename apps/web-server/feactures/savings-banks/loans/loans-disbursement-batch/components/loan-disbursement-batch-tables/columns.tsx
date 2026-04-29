'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { LoanDisbursementBatch } from '../../schemas/loan-disbursement/batch-api-response';
import { LOAN_DISBURSEMENT_BATCH_STATUS } from '../../schemas/loan-disbursement/batch-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<LoanDisbursementBatch>[] = [
  {
    accessorKey: 'loanDisbursementBatchReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'totalAmount',
    header: 'Monto Total',
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    accessorKey: 'recordCount',
    header: 'Ítems',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        LOAN_DISBURSEMENT_BATCH_STATUS[status as keyof typeof LOAN_DISBURSEMENT_BATCH_STATUS] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'DRAFT':
            return 'default';
          case 'UPLOADED':
            return 'warning';
          case 'PROCESSED':
            return 'success';
          case 'CANCELLED':
            return 'outline';
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
    accessorKey: 'createdAt',
    header: 'Fecha Creación',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
