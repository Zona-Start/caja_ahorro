import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  EXPENSE_STATUS_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
  type Expense,
} from '../../schemas/expenses.schema';
import { ExpenseCellActions } from './expense-cell-actions';

const STATUS_VARIANTS: Record<
  string,
  'success' | 'warning' | 'destructive' | 'secondary'
> = {
  APPROVED: 'success',
  PENDING_APPROVAL: 'warning',
  REJECTED: 'destructive',
};

export const expenseColumns: ColumnDef<Expense>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      if (!value) return '-';
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toLocaleDateString('es-VE');
    },
  },
  {
    accessorKey: 'categoryName',
    header: 'Categoría',
    cell: ({ getValue }) => getValue<string>() || '-',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ getValue }) => getValue<string>() || '-',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue<string>() ?? 'PENDING_APPROVAL';
      return (
        <Badge variant={STATUS_VARIANTS[value] ?? 'secondary'}>
          {EXPENSE_STATUS_OPTIONS[
            value as keyof typeof EXPENSE_STATUS_OPTIONS
          ] ?? value}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'paymentSource',
    header: 'Fuente',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        PAYMENT_SOURCE_OPTIONS[value as keyof typeof PAYMENT_SOURCE_OPTIONS] ||
        value ||
        '-'
      );
    },
  },
  {
    accessorKey: 'amountBase',
    header: 'Monto',
    cell: ({ row, getValue }) => {
      const value = getValue<number>();
      if (value == null) return '-';
      return formatCurrency(value, row.original.currencyCode || 'VES');
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <ExpenseCellActions data={row.original} />,
  },
];
