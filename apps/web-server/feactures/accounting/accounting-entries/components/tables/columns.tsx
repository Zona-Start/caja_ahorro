'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { ENTRY_STATUS } from '../../schemas/accounting-entry-options';
import { AccountingEntry } from '../../schemas/accounting-entry.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<AccountingEntry>[] = [
  {
    accessorKey: 'voucherNo',
    header: 'Comprobante',
    cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.voucherNo || '-'}</span>,
  },
  {
    accessorKey: 'entryDate',
    header: 'Fecha  Asiento',
    cell: ({ row }) => {
      const date = row.original.entryDate;
      if (!date) return '-';
      const dateStr = (date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0]) || '';
      const dateObj = new Date(dateStr.replace(/-/g, '/'));
      return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
    },
  },
  {
    accessorKey: 'postedAt',
    header: 'Contabilizado',
    cell: ({ row }) => {
      const date = row.original.postedAt;
      if (!date) return '-';
      const dateStr = (date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0]) || '';
      const dateObj = new Date(dateStr.replace(/-/g, '/'));
      return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
    },
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
