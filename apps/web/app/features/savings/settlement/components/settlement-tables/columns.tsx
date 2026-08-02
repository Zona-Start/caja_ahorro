import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import { type SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { ESTATUS_TYPES } from '../../schemas/settlement-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SettlementPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Asociado',
  },
  {
    accessorKey: 'liquidationDate',
    header: 'Fecha Liquidación',
    cell: ({ row }) => {
      const d = row.original.liquidationDate;
      if (!d) return '—';
      return new Date(d).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },
  {
    accessorKey: 'totalSavingsBalanceAtLiquidation',
    header: 'Haberes Totales',
    cell: ({ row }) =>
      formatCurrency(
        Number(row.original.totalSavingsBalanceAtLiquidation ?? 0),
        'VES',
      ),
  },
  {
    accessorKey: 'totalOutstandingLoansAtLiquidation',
    header: 'Préstamos Pend.',
    cell: ({ row }) => (
      <span className="text-red-600 dark:text-red-400">
        {formatCurrency(
          Number(row.original.totalOutstandingLoansAtLiquidation ?? 0),
          'VES',
        )}
      </span>
    ),
  },
  {
    accessorKey: 'totalOutstandingCreditsAtLiquidation',
    header: 'Créditos Pend.',
    cell: ({ row }) => (
      <span className="text-red-600 dark:text-red-400">
        {formatCurrency(
          Number(row.original.totalOutstandingCreditsAtLiquidation ?? 0),
          'VES',
        )}
      </span>
    ),
  },
  {
    accessorKey: 'netLiquidationAmount',
    header: 'Monto a Liquidar',
    cell: ({ row }) => {
      const amount = Number(row.original.netLiquidationAmount ?? 0);
      return (
        <span className={amount < 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
          {formatCurrency(amount, 'VES')}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

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
          case 'PROCESSED':
            return 'warning';
          case 'REJECTED':
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
