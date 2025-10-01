'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { BANK_TRANSACTION_CATEGORY, INTERNAL_LINK_STATUS, PAYMENT_METHOD } from '../../schemas/bank-movement-options';
import { BankMovementApiResponse } from '../../schemas/bank-movement-api.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<BankMovementApiResponse>[] = [
  {
    accessorKey: 'transactionDate',
    header: 'Fecha',
    cell: ({ row }) => new Date(row.original.transactionDate).toLocaleDateString(),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'transactionType',
    header: 'Tipo',
    cell: ({ row }) => {
        const type = row.original.transactionType;
        return PAYMENT_METHOD[type as keyof typeof PAYMENT_METHOD] || type;
    }
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => {
        const category = row.original.category;
        if (!category) return '-';
        return BANK_TRANSACTION_CATEGORY[category as keyof typeof BANK_TRANSACTION_CATEGORY] || category;
    }
  },
  {
    header: 'Débito',
    accessorKey: 'debitAmount',
    cell: ({ row }) => {
      const total = parseFloat(row.original.debitAmount);
      return formatCurrency(total, 'VES');
    },
  },
  {
    header: 'Crédito',
    accessorKey: 'creditAmount',
    cell: ({ row }) => {
      const total = parseFloat(row.original.creditAmount);
      return formatCurrency(total, 'VES');
    },
  },
  {
    accessorKey: 'internalLinkStatus',
    header: 'Estado de Vínculo',
    cell: ({ row }) => {
      const status = row.original.internalLinkStatus;
      const statusText =
        INTERNAL_LINK_STATUS[status as keyof typeof INTERNAL_LINK_STATUS] || status;
      const variant =
        status === 'LINKED'
          ? 'success'
          : status === 'UNLINKED'
            ? 'destructive'
            : 'default';
      return <Badge variant={variant}>{statusText}</Badge>;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
