import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { WITHDRAWAL_STATUS_TYPES } from '../../../schemas/inquiry-options';
import type { WithdrawalListItem } from '../../../schemas/inquiry-schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<WithdrawalListItem>[] = [
  {
    accessorKey: 'referenceCode',
    header: 'Referencia',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.referenceCode || 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'withdrawalDate',
    header: 'Fecha',
    cell: ({ row }) => {
      const d = row.original.withdrawalDate;
      if (!d) return <span className="text-muted-foreground">N/A</span>;
      return new Date(d).toLocaleDateString('es-VE');
    },
  },
  {
    accessorKey: 'description',
    header: 'Tipo / Descripción',
    cell: ({ row }) => (
      <span className={row.original.description ? '' : 'text-muted-foreground italic'}>
        {row.original.description || 'Sin descripción'}
      </span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Solicitado',
    cell: ({ row }) => (
      <span className="font-mono">{formatCurrency(Number(row.original.amount), 'VES')}</span>
    ),
  },
  {
    accessorKey: 'disbursedAmount',
    header: 'Retirado',
    cell: ({ row }) => (
      <span className="font-mono text-amber-600">
        {formatCurrency(Number(row.original.disbursedAmount || 0), 'VES')}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        WITHDRAWAL_STATUS_TYPES[
          status as keyof typeof WITHDRAWAL_STATUS_TYPES
        ] || status;
      const variant = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'default';
          case 'APPROVED':
            return 'outline';
          case 'REJECTED':
          case 'CANCELLED':
            return 'destructive';
          case 'DISBURSED':
          case 'PROCESSED':
            return 'success';
          case 'PENDING_DISBURSEMENT_BANK_BATCH':
            return 'warning';
          default:
            return 'default';
        }
      })();
      return <Badge variant={variant as any}>{statusText}</Badge>;
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
