import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import {
  PAYMENT_METHOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../../schemas/bank-movement-options';
import type { BankMovement } from '../../schemas/bank-movement.schema';
import { CellAction } from './cell-action';

export const bankMovementsColumns: ColumnDef<BankMovement>[] = [
  {
    accessorKey: 'internalCode',
    header: 'Código',
    cell: ({ getValue }) => {
      return getValue<string>() || '-';
    },
  },
  {
    accessorKey: 'transactionDate',
    header: 'Fecha',
    cell: ({ getValue }) => {
      const value = getValue();
      return value ? new Date(value as string | Date).toLocaleDateString() : '-';
    },
  },
  {
    accessorKey: 'bankAccountNumber',
    header: 'Cuenta',
    cell: ({ row }) => {
      const name = row.original.bankAccountName;
      const num = row.original.bankAccountNumber;
      return name ? `${name} - ${num}` : num || row.original.bankAccountId;
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return PAYMENT_METHOD_OPTIONS[value as keyof typeof PAYMENT_METHOD_OPTIONS] || value;
    },
  },
  {
    accessorKey: 'creditAmount',
    header: 'Crédito',
    cell: ({ row, getValue }) => {
      const value = getValue<number>();
      if (!value) return '-';
      return formatCurrency(value, row.original.bankCurrencyCode || 'VES');
    },
  },
  {
    accessorKey: 'debitAmount',
    header: 'Débito',
    cell: ({ row, getValue }) => {
      const value = getValue<number>();
      if (!value) return '-';
      return formatCurrency(value, row.original.bankCurrencyCode || 'VES');
    },
  },
  {
    accessorKey: 'internalLinkStatus',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      const isLinked = value === 'LINKED';
      return (
        <Badge variant={isLinked ? 'success' : 'secondary'}>
          {isLinked ? 'Vinculado' : 'Sin Vincular'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
