import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  EXPENSE_NATURE_OPTIONS,
  EXPENSE_STATUS_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
  type Expense,
} from '../../schemas/expenses.schema';
import { ExpenseCellActions } from './expense-cell-actions';

const STATUS_VARIANTS: Record<
  string,
  'success' | 'warning' | 'destructive' | 'secondary'
> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  PAID: 'secondary',
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
    accessorKey: 'nature',
    header: 'Naturaleza',
    cell: ({ getValue }) => {
      const value = getValue<string>() ?? 'VARIABLE';
      return (
        <Badge variant={value === 'FIXED' ? 'warning' : 'outline'}>
          {EXPENSE_NATURE_OPTIONS[
            value as keyof typeof EXPENSE_NATURE_OPTIONS
          ] ?? value}
        </Badge>
      );
    },
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

      const currency = row.original.currencyCode || 'VES';
      // El monto base viene expresado en Bolívares (VES)
      if (currency === 'VES') {
        return formatCurrency(value, 'VES');
      }

      // En divisa: monto real = monto en Bs / tasa de cambio guardada
      const rate = Number(row.original.exchangeRate ?? 0);
      const foreignAmount = rate > 0 ? value / rate : value;
      const formatted = foreignAmount.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return (
        <span className="whitespace-nowrap font-medium">
          {currency} {formatted}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <ExpenseCellActions data={row.original} />,
  },
];
