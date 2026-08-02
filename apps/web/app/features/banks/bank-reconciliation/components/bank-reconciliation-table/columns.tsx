import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { formatCurrency, formatDbDate } from '@/lib/format-utils';
import { RECONCILIATION_STATUS_OPTIONS } from '../../schemas/bank-reconciliation-options';
import type { BankReconciliation } from '../../schemas/bank-reconciliation.schema';
import { CellAction } from './cell-action';

export const bankReconciliationColumns: ColumnDef<BankReconciliation>[] = [
  {
    accessorKey: 'startDate',
    header: 'Desde',
    cell: ({ getValue }) => formatDbDate(getValue<string>()),
  },
  {
    accessorKey: 'statementDate',
    header: 'Hasta',
    cell: ({ getValue }) => formatDbDate(getValue<string>()),
  },
  {
    accessorKey: 'bankAccountId',
    header: 'Cuenta',
    cell: ({ getValue }) => {
      return (getValue<string>() || '-').slice(0, 8) + '...';
    },
  },
  {
    accessorKey: 'statementEndingBalance',
    header: 'Saldo Extracto',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      if (value == null) return '-';
      return formatCurrency(value, 'VES');
    },
  },
  {
    accessorKey: 'bookBalanceBefore',
    header: 'Saldo Libros (Antes)',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      if (value == null) return '-';
      return formatCurrency(value, 'VES');
    },
  },
  {
    accessorKey: 'bookBalanceAfter',
    header: 'Saldo Libros (Después)',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      if (value == null) return '-';
      return formatCurrency(value, 'VES');
    },
  },
  {
    accessorKey: 'difference',
    header: 'Diferencia',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      if (value == null) return '-';
      return (
        <span
          className={
            value === 0
              ? 'text-green-600 font-semibold'
              : 'text-red-600 font-semibold'
          }
        >
          {formatCurrency(value, 'VES')}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const label =
        RECONCILIATION_STATUS_OPTIONS[
          value as keyof typeof RECONCILIATION_STATUS_OPTIONS
        ] || value;
      const variant =
        value === 'COMPLETED'
          ? 'success'
          : value === 'IN_PROGRESS'
            ? 'warning'
            : value === 'REVIEWED'
              ? 'secondary'
              : 'default';
      return (
        <Badge variant={variant as any}>{label || value || '-'}</Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
