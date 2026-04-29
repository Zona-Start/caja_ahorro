'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { apiBankMovementSchema } from '../../schemas/bank-movement-api.schema';
import {
  INTERNAL_LINK_STATUS,
  RECONCILIATION_ITEM_STATUS,
} from '../../schemas/bank-movement-options';
import { CellAction } from './cell-action';

export type BankMovementColumn = z.infer<typeof apiBankMovementSchema>;

export const columns: ColumnDef<BankMovementColumn>[] = [
  {
    accessorKey: 'transactionDate',
    header: 'Fecha',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'bankReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'debitAmount',
    header: 'Débito',
    cell: ({ row }) => formatCurrency(Number(row.original.debitAmount), 'VES'),
  },
  {
    accessorKey: 'creditAmount',
    header: 'Crédito',
    cell: ({ row }) => formatCurrency(Number(row.original.creditAmount), 'VES'),
  },
  {
    accessorKey: 'reconciliationStatus',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.reconciliationStatus;
      const statusText =
        RECONCILIATION_ITEM_STATUS[
          status as keyof typeof RECONCILIATION_ITEM_STATUS
        ] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'PENDING':
            return 'default';
          case 'RECONCILED':
            return 'success';
          case 'MANUAL_MATCH':
            return 'success';
          case 'ADJUSTMENT':
            return 'secondary';
          case 'EXCLUDED':
            return 'outline';
          case 'VOIDED':
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
    accessorKey: 'internalLinkStatus',
    header: 'Vínculo',
    cell: ({ row }) => {
      const status = row.original.internalLinkStatus;
      const statusText =
        INTERNAL_LINK_STATUS[status as keyof typeof INTERNAL_LINK_STATUS] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'LINKED':
            return 'success';
          case 'UNLINKED':
            return 'secondary';
          case 'PARTIALLY_LINKED':
            return 'outline';
          case 'NOT_APPLICABLE':
            return 'default';
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
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
