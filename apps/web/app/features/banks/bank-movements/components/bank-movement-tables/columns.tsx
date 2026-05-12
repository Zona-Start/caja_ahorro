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
    accessorKey: 'transactionDate',
    header: 'Fecha',
    cell: ({ getValue }) => {
      const value = getValue();
      return value
        ? new Date(value as string | Date).toLocaleDateString()
        : '-';
    },
  },
  {
    accessorKey: 'bankAccount',
    header: 'Cuenta',
    cell: ({ row }) => {
      const bankAccount = row.original.bankAccount;
      return bankAccount
        ? `${bankAccount.accountName} - ${bankAccount.accountNumber}`
        : '-';
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        CATEGORY_OPTIONS[value as keyof typeof CATEGORY_OPTIONS] || value
      );
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método de Pago',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        PAYMENT_METHOD_OPTIONS[
          value as keyof typeof PAYMENT_METHOD_OPTIONS
        ] || value
      );
    },
  },
  {
    accessorKey: 'creditAmount',
    header: 'Crédito',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return value != null ? formatCurrency(value, 'VES') : '-';
    },
  },
  {
    accessorKey: 'debitAmount',
    header: 'Débito',
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return value != null ? formatCurrency(value, 'VES') : '-';
    },
  },
  {
    accessorKey: 'bankReference',
    header: 'Referencia',
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value || '-';
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
