'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { ENTRY_STATUS } from '../../schemas/accounting-entry-options';
import { AccountingEntry } from '../../schemas/accounting-entry.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountingEntry>[] = [
  {
    accessorKey: 'entryDate',
    header: 'Fecha',
    cell: ({ row }) => new Date(row.original.entryDate).toLocaleDateString(),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status!;
      const statusText =
        ENTRY_STATUS[status as keyof typeof ENTRY_STATUS] || status;
      const variant =
        status === 'POSTED'
          ? 'success'
          : status === 'CANCELLED'
            ? 'destructive'
            : status === 'PENDING'
              ? 'warning'
              : 'default';
      return <Badge variant={variant}>{statusText}</Badge>;
    },
  },
  {
    header: 'Debe',
    cell: ({ row }) => {
      const total = row.original.details.reduce(
        (sum, d) => sum + Number(d.debit),
        0,
      );
      return formatCurrency(total, 'VES');
    },
  },
  {
    header: 'Haber',
    cell: ({ row }) => {
      const total = row.original.details.reduce(
        (sum, d) => sum + Number(d.credit),
        0,
      );
      return formatCurrency(total, 'VES');
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
