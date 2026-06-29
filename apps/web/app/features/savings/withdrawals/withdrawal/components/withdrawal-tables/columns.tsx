import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import { type WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { ESTATUS_TYPES } from '../../schemas/withdrawal-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<WithdrawalPaymentApi>[] = [
  {
    accessorKey: 'associateCedula',
    header: 'Cédula',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Asociado',
  },
  {
    accessorKey: 'withdrawalType',
    header: 'Tipo Retiro',
  },
  {
    accessorKey: 'withdrawalDate',
    header: 'Fecha',
    cell: ({ row }) => {
      const d = row.original.withdrawalDate;
      if (!d) return '—';
      return new Date(d).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto',
    cell: ({ row }) =>
      formatCurrency(Number(row.original.requestedAmount ?? 0), 'VES'),
  },
  {
    accessorKey: 'disbursedAmount',
    header: 'Desembolsado',
    cell: ({ row }) =>
      formatCurrency(Number(row.original.disbursedAmount ?? 0), 'VES'),
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

      const variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning' = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'default';
          case 'APPROVED':
            return 'warning';
          case 'REJECTED':
          case 'CANCELLED':
            return 'destructive';
          case 'PENDING_DISBURSEMENT_BANK_BATCH':
            return 'outline';
          case 'DISBURSED':
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
