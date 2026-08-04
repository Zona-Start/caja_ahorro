import type { ColumnDef } from '@tanstack/react-table';
import type { AccountingBalance } from '../../schemas/accounting-balance.schema';
import { CellAction } from './cell-action';
import { formatCurrency } from '@/lib/format-utils';

export const columns: ColumnDef<AccountingBalance>[] = [
  {
    accessorKey: 'accountCode',
    header: 'Código de Cuenta',
  },
  {
    accessorKey: 'accountName',
    header: 'Nombre de Cuenta',
  },
  {
    accessorKey: 'accountNature',
    header: 'Naturaleza',
    cell: ({ row }) => {
      const nature = row.original.accountNature;
      return nature === 'DEBIT' ? 'Deudora' : 'Acreedora';
    },
  },
  {
    accessorKey: 'initialBalance',
    header: 'Saldo Inicial',
    cell: ({ row }) => {
      const value = parseFloat(row.original.initialBalance);
      return formatCurrency(value, 'VES');
    },
  },
  {
    accessorKey: 'debitBalance',
    header: 'Débitos',
    cell: ({ row }) => {
      const value = parseFloat(row.original.debitBalance);
      return formatCurrency(value, 'VES');
    },
  },
  {
    accessorKey: 'creditBalance',
    header: 'Créditos',
    cell: ({ row }) => {
      const value = parseFloat(row.original.creditBalance);
      return formatCurrency(value, 'VES');
    },
  },
  {
    accessorKey: 'finalBalance',
    header: 'Saldo Final',
    cell: ({ row }) => {
      const value = parseFloat(row.original.finalBalance);
      return formatCurrency(value, 'VES');
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
